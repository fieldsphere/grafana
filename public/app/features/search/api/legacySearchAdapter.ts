import { getAPIBaseURL } from '@grafana/api-clients';

import { type DashboardSearchItem, DashboardSearchItemType } from '../types';

const DASHBOARD_API_GROUP = 'dashboard.grafana.app';
const DASHBOARD_API_VERSION = 'v0alpha1';

export type LegacySearchQuery = {
  query?: string;
  tag?: string | string[];
  type?: string;
  dashboardUIDs?: string | string[];
  dashboardUID?: string | string[];
  folderUIDs?: string | string[];
  starred?: boolean | string;
  limit?: number | string;
  page?: number | string;
  permission?: string;
  sort?: string;
  deleted?: boolean | string;
};

export type ApisSearchHit = {
  resource: string;
  name: string;
  title: string;
  tags?: string[];
  folder?: string;
  url?: string;
};

export type ApisSearchResponse = {
  totalHits: number;
  hits: ApisSearchHit[];
};

/**
 * Maps a legacy `/api/search` query object onto `/apis` dashboard search params.
 * Keep this table in sync with docs/sources/developer-resources/api-reference/http-api/apis-migration.md.
 */
export function mapLegacySearchQuery(query: LegacySearchQuery = {}): URLSearchParams {
  const params = new URLSearchParams();
  params.set('query', query.query?.toString() || '*');

  const limit = toPositiveInt(query.limit);
  const page = toPositiveInt(query.page);
  if (limit) {
    params.set('limit', String(limit));
    if (page && page > 1) {
      params.set('offset', String((page - 1) * limit));
    }
  }

  const type = mapLegacyType(query.type);
  if (type) {
    params.append('type', type);
  }

  for (const folder of toArray(query.folderUIDs)) {
    params.append('folder', folder);
  }

  for (const name of [...toArray(query.dashboardUIDs), ...toArray(query.dashboardUID)]) {
    params.append('name', name);
  }

  for (const tag of toArray(query.tag)) {
    params.append('tag', tag);
  }

  const sort = mapLegacySort(query.sort);
  if (sort) {
    params.set('sort', sort);
  }

  if (query.permission === 'Edit' || query.permission === 'edit') {
    params.set('permission', 'Edit');
  } else if (query.permission === 'View' || query.permission === 'view') {
    params.set('permission', 'View');
  }

  return params;
}

export function mapLegacyType(type?: string): 'dashboard' | 'folder' | undefined {
  if (type === 'dash-db' || type === 'dashboard') {
    return 'dashboard';
  }
  if (type === 'dash-folder' || type === 'folder') {
    return 'folder';
  }
  return undefined;
}

export function mapLegacySort(sort?: string): string | undefined {
  if (!sort) {
    return undefined;
  }
  if (sort === 'alpha-asc') {
    return 'title';
  }
  if (sort === 'alpha-desc') {
    return '-title';
  }
  return sort.replace('_sort', '').replace('name', 'title');
}

export function mapApisHitToLegacyItem(hit: ApisSearchHit): DashboardSearchItem {
  const isFolder = hit.resource === 'folders' || hit.resource === 'folder';
  const url = hit.url || (isFolder ? `/dashboards/f/${hit.name}` : `/d/${hit.name}`);
  return {
    uid: hit.name,
    title: hit.title,
    uri: isFolder ? `db/${hit.name}` : `db/${hit.name}`,
    url,
    type: isFolder ? DashboardSearchItemType.DashFolder : DashboardSearchItemType.DashDB,
    tags: hit.tags ?? [],
    isStarred: false,
    folderUid: hit.folder || undefined,
  };
}

type TrashListItem = {
  metadata?: { name?: string; annotations?: Record<string, string> };
  spec?: { title?: string };
};

/**
 * Accepts `/apis` search `{hits}`, a bare hit array, or a k8s list `{items}`
 * (trash listing).
 */
export function hitsFromApisResponse(data: unknown): ApisSearchHit[] {
  if (Array.isArray(data)) {
    return data as ApisSearchHit[];
  }
  if (!data || typeof data !== 'object') {
    return [];
  }
  const obj = data as { hits?: ApisSearchHit[]; items?: Array<ApisSearchHit | TrashListItem> };
  if (Array.isArray(obj.hits)) {
    return obj.hits;
  }
  if (!Array.isArray(obj.items)) {
    return [];
  }
  return obj.items.map((item) => {
    if (item && 'name' in item && typeof item.name === 'string') {
      return item as ApisSearchHit;
    }
    const meta = (item as TrashListItem).metadata;
    const spec = (item as TrashListItem).spec;
    return {
      resource: 'dashboards',
      name: meta?.name ?? '',
      title: spec?.title ?? meta?.name ?? '',
      folder: meta?.annotations?.['grafana.app/folder'],
    };
  });
}

export function buildApisSearchUrl(query: LegacySearchQuery = {}): string {
  const params = mapLegacySearchQuery(query);
  if (isTruthy(query.deleted)) {
    return `${getAPIBaseURL(DASHBOARD_API_GROUP, 'v1beta1')}/dashboards/?labelSelector=grafana.app/get-trash=true`;
  }
  return `${getAPIBaseURL(DASHBOARD_API_GROUP, DASHBOARD_API_VERSION)}/search?${params.toString()}`;
}

function toArray(value?: string | string[]): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function toPositiveInt(value?: number | string): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function isTruthy(value?: boolean | string): boolean {
  return value === true || value === 'true';
}
