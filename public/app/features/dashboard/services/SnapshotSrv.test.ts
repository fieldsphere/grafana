import { http, HttpResponse } from 'msw';

import { setBackendSrv } from '@grafana/runtime';
import { FlagKeys } from '@grafana/runtime/internal';
import server, { setupMockServer } from '@grafana/test-utils/server';
import { setTestFlags } from '@grafana/test-utils/unstable';
import { backendSrv } from 'app/core/services/backend_srv';
import { configureStore } from 'app/store/configureStore';

import { getDashboardSnapshotSrv } from './SnapshotSrv';

setBackendSrv(backendSrv);
setupMockServer();

const K8S_SNAPSHOTS = '/apis/dashboard.grafana.app/v0alpha1/namespaces/default/snapshots';
const K8S_CREATE = `${K8S_SNAPSHOTS}/create`;
const K8S_SETTINGS = `${K8S_SNAPSHOTS}/settings`;
const K8S_ITEM = `${K8S_SNAPSHOTS}/:name`;
const K8S_DASHBOARD = `${K8S_SNAPSHOTS}/:name/dashboard`;

const LEGACY_LIST = '/api/dashboard/snapshots';
const LEGACY_CREATE = '/api/snapshots';
const LEGACY_ITEM = '/api/snapshots/:key';
const LEGACY_SETTINGS = '/api/snapshot/shared-options';

const createCmd = { dashboard: { title: 'Dash' }, name: 'Snap' };

const createResponse = {
  key: 'snap-key',
  url: '/dashboard/snapshot/snap-key',
  deleteUrl: '/api/snapshots-delete/del-key',
};

const sharingOptions = {
  externalEnabled: true,
  externalSnapshotName: 'Publish to snapshots.raintank.io',
  externalSnapshotURL: 'https://snapshots.raintank.io',
  snapshotEnabled: true,
};

const k8sList = {
  items: [
    {
      metadata: { name: 'k8s-snap-1', namespace: 'default', resourceVersion: '1', creationTimestamp: '' },
      spec: { title: 'K8s Snap 1', external: false },
    },
  ],
  metadata: { continue: 'tok-page-2', resourceVersion: '1' },
};

const k8sSnapshot = {
  metadata: { name: 'snap-key', namespace: 'default', resourceVersion: '7', creationTimestamp: '' },
  spec: { title: 'Snap dash', external: false },
};

const k8sDashboard = {
  spec: { title: 'Snap dash', uid: 'dash-uid', panels: [], schemaVersion: 39 },
};

function recordPathnames(method: 'get' | 'post' | 'delete', url: string, body: object) {
  const paths: string[] = [];
  const handler = ({ request }: { request: Request }) => {
    paths.push(new URL(request.url).pathname);
    return HttpResponse.json(body);
  };
  if (method === 'get') {
    server.use(http.get(url, handler));
  } else if (method === 'post') {
    server.use(http.post(url, handler));
  } else {
    server.use(http.delete(url, handler));
  }
  return paths;
}

describe('getDashboardSnapshotSrv', () => {
  beforeEach(() => {
    configureStore();
    setTestFlags();
  });

  afterEach(() => {
    setTestFlags();
  });

  describe('default (snapshots.kubernetesSnapshots on)', () => {
    it('lists snapshots from /apis and maps k8s items', async () => {
      const paths = recordPathnames('get', K8S_SNAPSHOTS, k8sList);

      const result = await getDashboardSnapshotSrv().getSnapshots();

      expect(paths).toEqual([K8S_SNAPSHOTS]);
      expect(result).toEqual({
        items: [{ key: 'k8s-snap-1', name: 'K8s Snap 1', external: false, externalUrl: undefined }],
        continueToken: 'tok-page-2',
      });
    });

    it('creates a snapshot via /apis .../snapshots/create', async () => {
      const paths = recordPathnames('post', K8S_CREATE, createResponse);

      const result = await getDashboardSnapshotSrv().create(createCmd);

      expect(paths).toEqual([K8S_CREATE]);
      expect(result).toEqual(createResponse);
    });

    it('deletes a snapshot via /apis .../snapshots/:name', async () => {
      const paths = recordPathnames('delete', K8S_ITEM, {});

      await getDashboardSnapshotSrv().deleteSnapshot('snap-key');

      expect(paths).toEqual([`${K8S_SNAPSHOTS}/snap-key`]);
    });

    it('loads sharing options from /apis .../snapshots/settings', async () => {
      const paths = recordPathnames('get', K8S_SETTINGS, sharingOptions);

      const result = await getDashboardSnapshotSrv().getSharingOptions();

      expect(paths).toEqual([K8S_SETTINGS]);
      expect(result).toEqual(sharingOptions);
    });

    it('loads a snapshot from the k8s snapshot and dashboard subresource', async () => {
      const paths: string[] = [];
      server.use(
        http.get(K8S_ITEM, ({ request }) => {
          paths.push(new URL(request.url).pathname);
          return HttpResponse.json(k8sSnapshot);
        }),
        http.get(K8S_DASHBOARD, ({ request }) => {
          paths.push(new URL(request.url).pathname);
          return HttpResponse.json(k8sDashboard);
        })
      );

      const result = await getDashboardSnapshotSrv().getSnapshot('snap-key');

      expect(paths).toEqual(
        expect.arrayContaining([`${K8S_SNAPSHOTS}/snap-key`, `${K8S_SNAPSHOTS}/snap-key/dashboard`])
      );
      expect(paths).toHaveLength(2);
      expect(result.dashboard.title).toBe('Snap dash');
      expect(result.dashboard.uid).toBe('dash-uid');
      expect(result.meta.isSnapshot).toBe(true);
      expect(result.meta.k8s).toEqual(k8sSnapshot.metadata);
    });
  });

  describe('snapshots.kubernetesSnapshots off', () => {
    beforeEach(() => {
      setTestFlags({ [FlagKeys.SnapshotsKubernetesSnapshots]: false });
    });

    it('lists snapshots from /api/dashboard/snapshots', async () => {
      const paths = recordPathnames('get', LEGACY_LIST, [
        { name: 'Legacy Snap', key: 'legacy-key', external: false, externalUrl: '' },
      ]);

      const result = await getDashboardSnapshotSrv().getSnapshots();

      expect(paths).toEqual([LEGACY_LIST]);
      expect(result).toEqual({
        items: [{ name: 'Legacy Snap', key: 'legacy-key', external: false, externalUrl: '' }],
        continueToken: undefined,
      });
    });

    it('creates a snapshot via /api/snapshots', async () => {
      const paths = recordPathnames('post', LEGACY_CREATE, createResponse);

      const result = await getDashboardSnapshotSrv().create(createCmd);

      expect(paths).toEqual([LEGACY_CREATE]);
      expect(result).toEqual(createResponse);
    });

    it('loads a snapshot from /api/snapshots/:key and clears canShare', async () => {
      const paths = recordPathnames('get', LEGACY_ITEM, {
        dashboard: { title: 'Legacy dash', uid: 'legacy-uid' },
        meta: { canShare: true },
      });

      const result = await getDashboardSnapshotSrv().getSnapshot('legacy-key');

      expect(paths).toEqual(['/api/snapshots/legacy-key']);
      expect(result.dashboard.title).toBe('Legacy dash');
      expect(result.meta.canShare).toBe(false);
    });

    it('loads sharing options from /api/snapshot/shared-options', async () => {
      const paths = recordPathnames('get', LEGACY_SETTINGS, sharingOptions);

      const result = await getDashboardSnapshotSrv().getSharingOptions();

      expect(paths).toEqual([LEGACY_SETTINGS]);
      expect(result).toEqual(sharingOptions);
    });
  });
});
