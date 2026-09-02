import { DashboardSearchItemType } from '../types';

import {
  buildApisSearchUrl,
  hitsFromApisResponse,
  mapApisHitToLegacyItem,
  mapLegacySearchQuery,
  mapLegacySort,
  mapLegacyType,
} from './legacySearchAdapter';

jest.mock('@grafana/api-clients', () => ({
  getAPIBaseURL: (group: string, version: string) => `/apis/${group}/${version}/namespaces/default`,
}));

describe('legacySearchAdapter', () => {
  it('maps dash-db and dash-folder types onto /apis type params', () => {
    expect(mapLegacyType('dash-db')).toBe('dashboard');
    expect(mapLegacyType('dash-folder')).toBe('folder');
    expect(mapLegacyType('dashboard')).toBe('dashboard');
    expect(mapLegacyType(undefined)).toBeUndefined();
  });

  it('maps alpha sort names onto title sort fields', () => {
    expect(mapLegacySort('alpha-asc')).toBe('title');
    expect(mapLegacySort('alpha-desc')).toBe('-title');
    expect(mapLegacySort('name_sort')).toBe('title');
  });

  it('builds /apis search params from a legacy query object', () => {
    const params = mapLegacySearchQuery({
      query: 'cpu',
      type: 'dash-db',
      folderUIDs: ['ops'],
      dashboardUIDs: ['sales', 'infra'],
      tag: ['prod'],
      sort: 'alpha-asc',
      permission: 'Edit',
      limit: 25,
      page: 3,
    });

    expect(params.get('query')).toBe('cpu');
    expect(params.getAll('type')).toEqual(['dashboard']);
    expect(params.getAll('folder')).toEqual(['ops']);
    expect(params.getAll('name')).toEqual(['sales', 'infra']);
    expect(params.getAll('tag')).toEqual(['prod']);
    expect(params.get('sort')).toBe('title');
    expect(params.get('permission')).toBe('Edit');
    expect(params.get('limit')).toBe('25');
    expect(params.get('offset')).toBe('50');
  });

  it('maps an /apis hit back to the legacy Hit shape', () => {
    const item = mapApisHitToLegacyItem({
      resource: 'dashboards',
      name: 'abc',
      title: 'CPU',
      tags: ['prod'],
      folder: 'ops',
      url: '/d/abc',
    });

    expect(item).toEqual({
      uid: 'abc',
      title: 'CPU',
      uri: 'db/abc',
      url: '/d/abc',
      type: DashboardSearchItemType.DashDB,
      tags: ['prod'],
      isStarred: false,
      folderUid: 'ops',
    });
  });

  it('points deleted searches at the trash label selector', () => {
    expect(buildApisSearchUrl({ deleted: true })).toBe(
      '/apis/dashboard.grafana.app/v1beta1/namespaces/default/dashboards/?labelSelector=grafana.app/get-trash=true'
    );
  });

  it('points live searches at the dashboard v0alpha1 search subresource', () => {
    expect(buildApisSearchUrl({ query: 'cpu', type: 'dash-folder' })).toBe(
      '/apis/dashboard.grafana.app/v0alpha1/namespaces/default/search?query=cpu&type=folder'
    );
  });

  it('reads hits from an /apis search envelope', () => {
    expect(
      hitsFromApisResponse({
        hits: [{ resource: 'dashboards', name: 'abc', title: 'CPU' }],
      })
    ).toEqual([{ resource: 'dashboards', name: 'abc', title: 'CPU' }]);
  });

  it('maps a k8s trash list {items} onto search hits', () => {
    expect(
      hitsFromApisResponse({
        items: [
          {
            metadata: {
              name: 'gone',
              annotations: { 'grafana.app/folder': 'ops' },
            },
            spec: { title: 'Gone' },
          },
        ],
      })
    ).toEqual([
      {
        resource: 'dashboards',
        name: 'gone',
        title: 'Gone',
        folder: 'ops',
      },
    ]);
  });
});
