import { HttpResponse, http } from 'msw';

import { config, setBackendSrv } from '@grafana/runtime';
import { getCustomSearchHandler } from '@grafana/test-utils/handlers';
import server, { setupMockServer } from '@grafana/test-utils/server';
import { backendSrv } from 'app/core/services/backend_srv';
import { configureStore } from 'app/store/configureStore';

import { GrafanaSearcher, SearchQuery } from './types';
import { toDashboardResults, SearchHit, SearchAPIResponse, UnifiedSearcher } from './unified';

beforeEach(() => {
  jest.clearAllMocks();
  configureStore();
});

const mockFallbackSearcher = {
  search: jest.fn(),
} as unknown as GrafanaSearcher;

setBackendSrv(backendSrv);
setupMockServer();

describe('Unified Storage Searcher', () => {
  it('should perform search with basic query', async () => {
    const query: SearchQuery = {
      query: '*',
      limit: 50,
    };

    server.use(
      getCustomSearchHandler([
        { name: 'folder1', title: 'Folder 1', resource: 'folder' },
        { name: 'dashboard1', title: 'Dashboard 1', resource: 'dashboard', folder: 'folder1' },
      ])
    );

    const searcher = new UnifiedSearcher(mockFallbackSearcher);

    const response = await searcher.search(query);

    expect(response.view.length).toBe(2);
    expect(response.view.get(0).title).toBe('Folder 1');
    expect(response.view.get(1).title).toBe('Dashboard 1');

    const df = response.view.dataFrame;
    const locationInfo = df.meta?.custom?.locationInfo;
    expect(locationInfo).toBeDefined();
    expect(locationInfo?.folder1.name).toBe('Folder 1');
  });

  it('should perform search and sync folders with missing folder', async () => {
    server.use(
      getCustomSearchHandler([
        { name: 'folder2', title: 'Folder 2', resource: 'folder' },
        { name: 'db1', title: 'DB 1', resource: 'dashboard', folder: 'folder1' },
        { name: 'db2', title: 'DB 2', resource: 'dashboard', folder: 'folder2' },
      ])
    );

    const query: SearchQuery = {
      query: '*',
      limit: 50,
    };

    const searcher = new UnifiedSearcher(mockFallbackSearcher);

    const response = await searcher.search(query);

    expect(response.view.length).toBe(3);
    expect(response.view.get(0).title).toBe('Folder 2');
    expect(response.view.get(1).title).toBe('DB 1');
    expect(response.view.get(1).folder).toBe('sharedwithme');
    expect(response.view.get(2).title).toBe('DB 2');

    const df = response.view.dataFrame;
    const locationInfo = df.meta?.custom?.locationInfo;
    expect(locationInfo).toBeDefined();
    expect(locationInfo?.folder2.name).toBe('Folder 2');
  });

  it('should return tag facets via the search API client', async () => {
    server.use(
      getCustomSearchHandler([
        { name: 'd1', title: 'D1', resource: 'dashboards', tags: ['a', 'b'] },
        { name: 'd2', title: 'D2', resource: 'dashboards', tags: ['a'] },
      ])
    );

    const searcher = new UnifiedSearcher(mockFallbackSearcher);
    const terms = await searcher.tags({ query: '*' });

    expect(terms).toEqual(
      expect.arrayContaining([
        { term: 'a', count: 2 },
        { term: 'b', count: 1 },
      ])
    );
    expect(terms).toHaveLength(2);
  });

  it('should perform paging even with inconsistent fields', async () => {
    const query: SearchQuery = {
      query: '*',
      limit: 1,
    };

    server.use(
      getCustomSearchHandler([
        { name: 'dashboard1', title: 'Dashboard 1', resource: 'dashboards' },
        { name: 'dashboard2', title: 'Dashboard 2', resource: 'dashboards', description: 'foobar' },
      ])
    );

    const searcher = new UnifiedSearcher(mockFallbackSearcher);
    const response = await searcher.search(query);

    expect(response.view.length).toBe(1);

    await response.loadMoreItems(0, 1);

    expect(response.view.length).toBe(2);
    expect(response.view.get(0).folder).toBe('general');
    // TODO: right now this does not work (see unified.ts#getNextPage() for details) once the frame appending is fixed
    //  properly these expects should work
    // expect(response.view.get(0).description).toBe(null);
    // expect(response.view.get(1).description).toBe('foobar');
  });

  it('should not trigger bulk folder load when folder UID request is already inflight', async () => {
    let bulkLoadCallCount = 0;
    const folderUid = 'folder-a';
    const searchRoute = '/apis/dashboard.grafana.app/v0alpha1/namespaces/:namespace/search';

    server.use(
      http.get(searchRoute, async ({ request }) => {
        const url = new URL(request.url);
        const type = url.searchParams.get('type');
        const limit = url.searchParams.get('limit');
        const nameFilters = url.searchParams.getAll('name');

        if (type === 'folder' && limit === '5000' && nameFilters.length === 0) {
          bulkLoadCallCount++;
          return HttpResponse.json({ totalHits: 0, hits: [] });
        }

        if (type === 'folder' && nameFilters.includes(folderUid)) {
          await new Promise((resolve) => setTimeout(resolve, 25));
          return HttpResponse.json({
            totalHits: 1,
            hits: [{ name: folderUid, title: 'Folder A', resource: 'folder' }],
          });
        }

        return HttpResponse.json({
          totalHits: 1,
          hits: [{ name: 'dash-a', title: 'Dashboard A', resource: 'dashboard', folder: folderUid }],
        });
      })
    );

    const searcher = new UnifiedSearcher(mockFallbackSearcher);
    const query: SearchQuery = { query: '*', limit: 50 };

    const [first, second] = await Promise.all([searcher.search(query), searcher.search(query)]);

    expect(first.view.get(0).folder).toBe(folderUid);
    expect(second.view.get(0).folder).toBe(folderUid);
    expect(bulkLoadCallCount).toBe(0);
  });

  it('should resolve parent folder metadata for folder hits', async () => {
    const parentUid = 'parent-folder';
    const childUid = 'child-folder';
    const searchRoute = '/apis/dashboard.grafana.app/v0alpha1/namespaces/:namespace/search';

    server.use(
      http.get(searchRoute, ({ request }) => {
        const url = new URL(request.url);
        const type = url.searchParams.get('type');
        const nameFilters = url.searchParams.getAll('name');

        if (type === 'folder' && nameFilters.includes(parentUid)) {
          return HttpResponse.json({
            totalHits: 1,
            hits: [{ name: parentUid, title: 'Parent Folder', resource: 'folder' }],
          });
        }

        return HttpResponse.json({
          totalHits: 1,
          hits: [{ name: childUid, title: 'Child Folder', resource: 'folder', folder: parentUid }],
        });
      })
    );

    const searcher = new UnifiedSearcher(mockFallbackSearcher);
    const response = await searcher.search({ query: '*', limit: 50 });

    expect(response.view.get(0).folder).toBe(parentUid);
    expect(response.view.get(0).location).toBe(parentUid);
    expect(response.view.dataFrame.meta?.custom?.locationInfo?.[parentUid].name).toBe('Parent Folder');
  });
});

describe('toDashboardResults', () => {
  it('can create dashboard search results and set meta sortBy so column is added for sprinkles sort field', () => {
    const mockHits: SearchHit[] = [
      {
        resource: 'dashboard',
        name: 'Main Dashboard',
        title: 'Main Dashboard Title',
        location: '/dashboards/1',
        folder: 'General',
        tags: ['monitoring', 'performance'],
        field: { errors_today: 1 },
        url: '/dashboards/1/main-dashboard-title',
      },
      {
        resource: 'dashboard',
        name: 'Main Dashboard',
        title: 'Main Dashboard Title',
        location: '/dashboards/1',
        folder: 'General',
        tags: ['monitoring', 'performance'],
        field: { errors_today: 2 },
        url: '/dashboards/1/main-dashboard-title',
      },
    ];

    const mockResponse: SearchAPIResponse = {
      totalHits: 2,
      hits: mockHits,
      facets: {},
    };
    const results = toDashboardResults(mockResponse, 'errors_today');

    expect(results.length).toBe(2);
    const sprinklesField = results.fields.find((f) => f.name === 'errors_today');
    expect(sprinklesField).toBeDefined();
    expect(sprinklesField!.name).toBe('errors_today');
    expect(sprinklesField!.values).toEqual([1, 2]); // this also tests the hits original order is preserved
    expect(results.meta?.custom?.sortBy).toBe('errors_today');
  });

  it('will trim "-" from the sort field name', () => {
    const mockHits: SearchHit[] = [
      {
        resource: 'dashboard',
        name: 'Main Dashboard',
        title: 'Main Dashboard Title',
        location: '/dashboards/1',
        folder: 'General',
        tags: ['monitoring', 'performance'],
        field: { errors_today: 1 },
        url: '/dashboards/1/main-dashboard-title',
      },
    ];

    const mockResponse: SearchAPIResponse = {
      totalHits: 0,
      hits: mockHits,
      facets: {},
    };
    const results = toDashboardResults(mockResponse, '-errors_today');

    expect(results.meta?.custom?.sortBy).toBe('errors_today');
  });

  describe('respects appSubUrl in search result URLs', () => {
    const originalAppSubUrl = config.appSubUrl;

    afterEach(() => {
      config.appSubUrl = originalAppSubUrl;
    });

    it('should prepend appSubUrl to folder and dashboard URLs in locationInfo', async () => {
      config.appSubUrl = '/grafana';

      server.use(
        getCustomSearchHandler([
          { name: 'folder1', title: 'Folder 1', resource: 'folder' },
          { name: 'dashboard1', title: 'Dashboard 1', resource: 'dashboard', folder: 'folder1' },
        ])
      );

      const searcher = new UnifiedSearcher(mockFallbackSearcher);
      const response = await searcher.search({ query: 'test', limit: 50 });

      const locationInfo = response.view.dataFrame.meta?.custom?.locationInfo;
      expect(locationInfo?.general.url).toBe('/grafana/dashboards');
      expect(locationInfo?.folder1.url).toBe('/grafana/dashboards/f/folder1');
    });

    it('should work with empty appSubUrl', async () => {
      config.appSubUrl = '';

      server.use(
        getCustomSearchHandler([
          { name: 'folder1', title: 'Folder 1', resource: 'folder' },
          { name: 'dashboard1', title: 'Dashboard 1', resource: 'dashboard', folder: 'folder1' },
        ])
      );

      const searcher = new UnifiedSearcher(mockFallbackSearcher);
      const response = await searcher.search({ query: 'test', limit: 50 });

      const locationInfo = response.view.dataFrame.meta?.custom?.locationInfo;
      expect(locationInfo?.general.url).toBe('/dashboards');
      expect(locationInfo?.folder1.url).toBe('/dashboards/f/folder1');
    });
  });
});
