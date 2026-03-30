import { isEmpty } from 'lodash';

import { generatedAPI as legacyUserAPI } from '@grafana/api-clients/internal/rtkq/legacy/user';
import {
  API_GROUP as DASHBOARD_API_GROUP,
  ManagedBy,
  SearchDashboardsAndFoldersApiArg,
  SearchResults,
} from '@grafana/api-clients/rtkq/dashboard/v0alpha1';
import { arrayToDataFrame, DataFrame, DataFrameView, getDisplayProcessor, SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { generatedAPI, ListStarsApiResponse } from 'app/api/clients/collections/v1alpha1';
import { dashboardAPIv0alpha1 } from 'app/api/clients/dashboard/v0alpha1';
import { getAPIBaseURL } from 'app/api/utils';
import { TermCount } from 'app/core/components/TagFilter/TagFilter';
import { contextSrv } from 'app/core/services/context_srv';
import kbn from 'app/core/utils/kbn';
import { dispatch } from 'app/store/store';

import { deletedDashboardsCache } from './deletedDashboardsCache';
import {
  DashboardQueryResult,
  GrafanaSearcher,
  LocationInfo,
  QueryResponse,
  SearchQuery,
  SearchResultMeta,
} from './types';
import { appendFrame, filterSearchResults, replaceCurrentFolderQuery } from './utils';

// The backend returns an empty frame with a special name to indicate that the indexing engine is being rebuilt,
// and that it can not serve any search requests. We are temporarily using the old SQL Search API as a fallback when that happens.
const loadingFrameName = 'Loading';

export type SearchHit = {
  resource: string; // dashboards | folders
  /** Kubernetes resource name (dashboard UID, folder UID). */
  name: string;
  title: string;
  location: string;
  folder: string;
  tags: string[];

  field: Record<string, string | number>; // extra fields from the backend - sort fields included here as well

  // calculated in the frontend
  url: string;
  managedBy?: ManagedBy;
};

export type SearchAPIResponse = {
  totalHits: number;
  hits: SearchHit[];
  facets?: {
    tags?: {
      terms?: Array<{
        term: string;
        count: number;
      }>;
    };
  };
};

const folderViewSort = 'name_sort';

const pageSize = 50;

const folderListPageSize = 5000;

function resourceIsDashboard(resource: string): boolean {
  const r = resource.toLowerCase();
  return r === 'dashboard' || r === 'dashboards';
}

function resourceIsFolder(resource: string): boolean {
  const r = resource.toLowerCase();
  return r === 'folder' || r === 'folders';
}

function hitKindFromResource(resource: string): string {
  if (resourceIsDashboard(resource)) {
    return 'dashboard';
  }
  if (resourceIsFolder(resource)) {
    return 'folder';
  }
  return resource.endsWith('s') ? resource.slice(0, -1) : resource;
}

function staticLocationInfo(): Record<string, LocationInfo> {
  return {
    general: {
      kind: 'folder',
      name: 'Dashboards',
      url: `${config.appSubUrl}/dashboards`,
    },
    sharedwithme: {
      kind: 'sharedwithme',
      name: 'Shared with me',
      url: '',
    },
  };
}

function dashboardHitToSearchHit(hit: SearchResults['hits'][number]): SearchHit {
  return {
    resource: hit.resource,
    name: hit.name,
    title: hit.title,
    location: '',
    folder: hit.folder ?? '',
    tags: hit.tags ?? [],
    field: hit.field ?? {},
    url: '',
    managedBy: hit.managedBy,
  };
}

function searchResultsToApiResponse(result: SearchResults): SearchAPIResponse {
  const hits = (result.hits ?? []).map(dashboardHitToSearchHit);
  const facets = result.facets?.tags
    ? {
        tags: {
          terms: (result.facets.tags.terms ?? []).map((term) => ({
            term: term.term ?? '',
            count: term.count ?? 0,
          })),
        },
      }
    : undefined;
  return {
    totalHits: result.totalHits,
    hits,
    facets,
  };
}

function collectFolderUidsFromHits(hits: SearchHit[]): string[] {
  const uids = new Set<string>();
  for (const hit of hits) {
    if (hit.folder) {
      uids.add(hit.folder);
    }
  }
  return [...uids];
}

/**
 * Resolves folder UIDs to display metadata lazily (per-UID search), with a paginated bulk fallback
 * when the user lacks per-folder list access but can still search.
 */
class LocationFolderCache {
  private readonly map: Record<string, LocationInfo>;
  private readonly inflight = new Map<string, Promise<void>>();
  private bulkLoadPromise: Promise<void> | undefined;

  constructor() {
    this.map = { ...staticLocationInfo() };
  }

  getSnapshot(): Record<string, LocationInfo> {
    return this.map;
  }

  async ensureFolders(folderUids: string[]): Promise<void> {
    const missing = folderUids.filter((uid) => uid && this.map[uid] === undefined);
    if (!missing.length) {
      return;
    }
    await Promise.all(missing.map((uid) => this.fetchFolderByUid(uid)));
    const stillMissing = missing.filter((uid) => this.map[uid] === undefined);
    if (stillMissing.length) {
      await this.loadAllFoldersPaginated();
    }
  }

  private async fetchFolderByUid(uid: string): Promise<void> {
    if (this.map[uid] !== undefined) {
      return;
    }
    const inflight = this.inflight.get(uid);
    if (inflight) {
      return inflight;
    }
    const load = (async () => {
      try {
        const result = await dispatch(
          dashboardAPIv0alpha1.endpoints.searchDashboardsAndFolders.initiate({
            type: 'folder',
            query: '*',
            limit: 1,
            name: [uid],
          })
        ).unwrap();
        const hit = result.hits?.[0];
        if (hit) {
          this.map[uid] = {
            name: hit.title,
            kind: 'folder',
            url: toURL('folders', hit.name, hit.title),
          };
        }
      } finally {
        this.inflight.delete(uid);
      }
    })();
    this.inflight.set(uid, load);
    await load;
  }

  /** Loads every folder the user can list via search (paginated). Used when the UI needs a full UID→title map. */
  async loadAllFoldersPaginated(): Promise<void> {
    if (this.bulkLoadPromise) {
      return this.bulkLoadPromise;
    }
    this.bulkLoadPromise = (async () => {
      let offset = 0;
      for (;;) {
        const result = await dispatch(
          dashboardAPIv0alpha1.endpoints.searchDashboardsAndFolders.initiate({
            type: 'folder',
            query: '*',
            limit: folderListPageSize,
            offset,
          })
        ).unwrap();
        const hits = result.hits ?? [];
        if (hits.length === 0) {
          break;
        }
        for (const hit of hits) {
          if (this.map[hit.name] === undefined) {
            this.map[hit.name] = {
              name: hit.title,
              kind: 'folder',
              url: toURL('folders', hit.name, hit.title),
            };
          }
        }
        if (hits.length < folderListPageSize) {
          break;
        }
        offset += folderListPageSize;
      }
    })();
    return this.bulkLoadPromise;
  }
}

export class UnifiedSearcher implements GrafanaSearcher {
  private readonly folderCache: LocationFolderCache;

  constructor(private fallbackSearcher: GrafanaSearcher) {
    this.folderCache = new LocationFolderCache();
  }

  async search(query: SearchQuery): Promise<QueryResponse> {
    if (query.facet?.length) {
      throw new Error('facets not supported!');
    }
    return this.doSearchQuery(query);
  }

  async starred(query: SearchQuery): Promise<QueryResponse> {
    if (query.facet?.length) {
      throw new Error('facets not supported!');
    }
    // get the starred dashboards
    let starsIds: string[] | undefined = [];
    if (config.featureToggles.starsFromAPIServer) {
      const name = `user-${contextSrv.user.uid}`;
      const result: { data: ListStarsApiResponse } = await dispatch(
        generatedAPI.endpoints.listStars.initiate({
          fieldSelector: `metadata.name=${name}`,
        })
      );
      const items = result.data.items;
      starsIds = items?.length
        ? items[0].spec.resource.find(({ group, kind }) => group === DASHBOARD_API_GROUP && kind === 'Dashboard')
            ?.names || []
        : [];
    } else {
      starsIds = await dispatch(legacyUserAPI.endpoints.getStars.initiate()).unwrap();
    }

    if (starsIds?.length) {
      return this.doSearchQuery({
        ...query,
        name: starsIds,
        query: query.query ?? '*',
      });
    }
    // Nothing is starred
    return noDataResponse();
  }

  async tags(query: SearchQuery): Promise<TermCount[]> {
    const qry = query.query ?? '*';
    const result = await dispatch(
      dashboardAPIv0alpha1.endpoints.searchDashboardsAndFolders.initiate({
        query: qry,
        facet: ['tags'],
        facetLimit: 1000,
        limit: 1,
      })
    ).unwrap();
    return (
      result.facets?.tags?.terms?.map((term) => ({
        term: term.term ?? '',
        count: term.count ?? 0,
      })) ?? []
    );
  }

  async getLocationInfo() {
    await this.folderCache.loadAllFoldersPaginated();
    return this.folderCache.getSnapshot();
  }

  getSortOptions(): Promise<SelectableValue[]> {
    const opts: SelectableValue[] = [
      {
        value: folderViewSort,
        label: t('search.unified-searcher.opts.label.alphabetically-az', 'Alphabetically (A-Z)'),
      },
      { value: '-name_sort', label: t('search.unified-searcher.opts.label.alphabetically-za', 'Alphabetically (Z-A)') },
    ];

    if (config.licenseInfo.enabledFeatures.analytics) {
      for (const sf of sortFields) {
        opts.push({ value: `-${sf.name}`, label: `${sf.display} (most)` });
        opts.push({ value: `${sf.name}`, label: `${sf.display} (least)` });
      }
    }

    return Promise.resolve(opts);
  }

  async doSearchQuery(query: SearchQuery): Promise<QueryResponse> {
    const firstPageArg = await this.buildSearchApiArg(query, 0);

    let rsp: SearchAPIResponse;

    if (query.deleted) {
      const data = await deletedDashboardsCache.get();
      const results = filterSearchResults(data, query);
      rsp = { hits: results, totalHits: results.length };
    } else {
      rsp = await this.fetchSearchResponse(firstPageArg);
    }

    const first = toDashboardResults(rsp, query.sort ?? '');
    if (first.name === loadingFrameName) {
      return this.fallbackSearcher.search(query);
    }

    const customMeta = first.meta?.custom;
    const meta: SearchResultMeta = {
      count: customMeta?.count ?? first.length,
      max_score: customMeta?.max_score ?? 1,
      locationInfo: this.folderCache.getSnapshot(),
      sortBy: customMeta?.sortBy,
    };

    if (first.meta) {
      first.meta.custom = meta;
    }

    if (meta.sortBy?.length) {
      const field = first.fields.find((f) => f.name === meta.sortBy);
      if (field) {
        const name = getSortFieldDisplayName(field.name);
        field.config.displayName = name;
      }
    }

    let loadMax = 0;
    let pending: Promise<void> | undefined = undefined;

    const view = new DataFrameView<DashboardQueryResult>(first);

    const getNextPage = async () => {
      while (loadMax > view.dataFrame.length) {
        const offset = view.dataFrame.length;
        if (offset >= meta.count) {
          return;
        }
        const pageArg = await this.buildSearchApiArg(query, offset);
        const resp = await this.fetchSearchResponse(pageArg);
        const frame = toDashboardResults(resp, query.sort ?? '');
        if (!frame) {
          return;
        }

        appendFrame(view.dataFrame, frame);
      }
      pending = undefined;
    };

    return {
      totalRows: meta.count ?? first.length,
      view,
      loadMoreItems: async (_startIndex: number, stopIndex: number): Promise<void> => {
        loadMax = Math.max(loadMax, stopIndex + 1);
        if (!pending) {
          pending = getNextPage();
        }
        return pending;
      },

      isItemLoaded: (index: number): boolean => {
        return index < view.dataFrame.length;
      },
    };
  }

  private async fetchSearchResponse(arg: SearchDashboardsAndFoldersApiArg): Promise<SearchAPIResponse> {
    const result = await dispatch(dashboardAPIv0alpha1.endpoints.searchDashboardsAndFolders.initiate(arg)).unwrap();
    const rsp = searchResultsToApiResponse(result);
    await this.folderCache.ensureFolders(collectFolderUidsFromHits(rsp.hits));

    const locationInfo = this.folderCache.getSnapshot();
    const hits = rsp.hits.map((hit) => {
      if (!hit.folder) {
        return { ...hit, location: 'general', folder: 'general' };
      }

      if (locationInfo[hit.folder] === undefined) {
        return { ...hit, location: 'sharedwithme', folder: 'sharedwithme' };
      }

      return hit;
    });

    return { ...rsp, hits, totalHits: rsp.totalHits };
  }

  private async buildSearchApiArg(query: SearchQuery, offset: number): Promise<SearchDashboardsAndFoldersApiArg> {
    const q = await replaceCurrentFolderQuery(query);

    const arg: SearchDashboardsAndFoldersApiArg = {
      query: q.query ?? '*',
      limit: q.limit ?? pageSize,
      offset,
    };

    if (!isEmpty(q.location)) {
      arg.folder = q.location;
    }

    if (q.kind?.length) {
      const hasDash = q.kind.includes('dashboard');
      const hasFolder = q.kind.includes('folder');
      if (hasDash !== hasFolder) {
        arg.type = hasDash ? 'dashboard' : 'folder';
      }
    }

    if (q.ds_type?.length) {
      arg.dataSourceType = q.ds_type;
    }

    if (q.panel_type?.length) {
      arg.panelType = q.panel_type;
    }

    if (q.createdBy?.length) {
      arg.createdBy = q.createdBy;
    }

    if (q.panelTitleSearch) {
      arg.panelTitleSearch = true;
    }

    if (q.tags?.length) {
      arg.tags = q.tags;
    }

    if (q.sort) {
      const sort = q.sort.replace('_sort', '').replace('name', 'title');
      arg.sort = sort;
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      arg.field = sortField;
    }

    const nameFilters = [...(q.name ?? []), ...(q.uid ?? [])];
    if (nameFilters.length) {
      arg.name = nameFilters;
    }

    if (q.permission) {
      arg.permission = q.permission;
    }

    if (q.explain) {
      arg.explain = true;
    }

    return arg;
  }

  getFolderViewSort(): string {
    return 'name_sort';
  }
}

// Enterprise only sort field values for dashboards
const sortFields = [
  { name: 'views_total', display: 'Views total' },
  { name: 'views_last_30_days', display: 'Views 30 days' },
  { name: 'errors_total', display: 'Errors total' },
  { name: 'errors_last_30_days', display: 'Errors 30 days' },
];

function noDataResponse(): QueryResponse | PromiseLike<QueryResponse> {
  return {
    view: new DataFrameView({ length: 0, fields: [] }),
    totalRows: 0,
    loadMoreItems: async (_startIndex: number, _stopIndex: number): Promise<void> => {
      return;
    },
    isItemLoaded: (_index: number): boolean => {
      return true;
    },
  };
}

/** Given the internal field name, this gives a reasonable display name for the table colum header */
function getSortFieldDisplayName(name: string) {
  for (const sf of sortFields) {
    if (sf.name === name) {
      return sf.display;
    }
  }
  return name;
}

export function toDashboardResults(rsp: SearchAPIResponse, sort: string): DataFrame {
  const hits = rsp.hits;
  if (hits.length < 1) {
    return { fields: [], length: 0 };
  }
  const dashboardHits = hits.map((hit) => {
    let location = hit.folder;
    if (resourceIsDashboard(hit.resource) && isEmpty(location)) {
      location = 'general';
    }

    const field = Object.fromEntries(
      Object.entries(hit.field ?? {}).map(([key, value]) => [key, value == null ? '-' : value])
    );

    const resourceUid = hit.name;
    const displayTitle = hit.title;

    return {
      ...hit,
      uid: resourceUid,
      url: toURL(hit.resource, resourceUid, displayTitle),
      tags: (hit.tags || []).sort(),
      folder: hit.folder || 'general',
      location,
      name: displayTitle,
      kind: hitKindFromResource(hit.resource),
      managedBy: hit.managedBy,
      ...field,
    };
  });
  const frame = arrayToDataFrame(dashboardHits);
  frame.meta = {
    custom: {
      count: rsp.totalHits,
      max_score: 1,
    },
  };
  if (sort && frame.meta.custom) {
    frame.meta.custom.sortBy = sort.startsWith('-') ? sort.substring(1) : sort;
  }

  for (const field of frame.fields) {
    field.display = getDisplayProcessor({ field, theme: config.theme2 });
  }
  return frame;
}

function toURL(resource: string, name: string, title: string): string {
  if (resourceIsFolder(resource)) {
    return `${config.appSubUrl}/dashboards/f/${name}`;
  }
  const slug = kbn.slugifyForUrl(title);
  return `${config.appSubUrl}/d/${name}/${slug}`;
}
