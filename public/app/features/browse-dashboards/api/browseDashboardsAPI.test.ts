import { configureStore } from '@reduxjs/toolkit';
import type { Store } from 'redux';
import { Observable, of } from 'rxjs';
import { createFetchResponse } from 'test/helpers/createFetchResponse';

import { invalidateQuotaUsage } from '@grafana/api-clients/rtkq/quotas/v0alpha1';
import { Dashboard } from '@grafana/schema';
import { Spec as DashboardV2Spec } from '@grafana/schema/apis/dashboard.grafana.app/v2';
import { appNotificationsReducer } from 'app/core/reducers/appNotification';
import { getDashboardAPI } from 'app/features/dashboard/api/dashboard_api';
import { SaveDashboardCommand } from 'app/features/dashboard/components/SaveDashboard/types';
import { setStore } from 'app/store/store';

import { browseDashboardsAPI } from './browseDashboardsAPI';

const mockGet = jest.fn().mockResolvedValue({});
const mockPut = jest.fn().mockResolvedValue({});
const mockPost = jest.fn().mockResolvedValue({});
const mockFetch = jest.fn();

jest.mock('app/features/dashboard/api/dashboard_api', () => ({
  getDashboardAPI: jest.fn(),
}));

jest.mock('@grafana/api-clients/rtkq', () => ({
  createBaseQuery: jest.requireActual(
    '../../../../../packages/grafana-api-clients/src/clients/rtkq/createBaseQuery'
  ).createBaseQuery,
}));

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    get: mockGet,
    put: mockPut,
    post: mockPost,
    fetch: mockFetch,
  }),
  config: {
    ...jest.requireActual('@grafana/runtime').config,
    buildInfo: {
      version: '11.5.0-test-version-string',
    },
    featureToggles: {
      ...jest.requireActual('@grafana/runtime').config.featureToggles,
      provisioning: false,
    },
  },
}));

jest.mock('@grafana/api-clients/rtkq/quotas/v0alpha1', () => ({
  invalidateQuotaUsage: jest.fn(),
}));


describe('browseDashboardsAPI saveDashboard', () => {
  const getDashboardAPIMock = jest.mocked(getDashboardAPI);
  const createTestStore = () =>
    configureStore({
      reducer: {
        [browseDashboardsAPI.reducerPath]: browseDashboardsAPI.reducer,
        appNotifications: appNotificationsReducer,
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(browseDashboardsAPI.middleware),
    });

  beforeEach(() => {
    getDashboardAPIMock.mockReset();
    mockFetch.mockReset();
  });

  const createMockDashboardAPI = (saveDashboard: jest.Mock) =>
    ({ saveDashboard }) as unknown as ReturnType<typeof getDashboardAPI>;

  it('uses v1 dashboard API for v1 dashboards', async () => {
    const saveDashboardV1 = jest.fn().mockResolvedValue({ uid: 'test-uid-v1' });
    const saveDashboardV2 = jest.fn().mockResolvedValue({ uid: 'test-uid-v2' });

    getDashboardAPIMock.mockImplementation((version?: 'v1' | 'v2') => {
      if (version === 'v1') {
        return createMockDashboardAPI(saveDashboardV1);
      }
      if (version === 'v2') {
        return createMockDashboardAPI(saveDashboardV2);
      }
      return createMockDashboardAPI(jest.fn());
    });

    const cmd: SaveDashboardCommand<Dashboard> = {
      dashboard: { title: 'V1', panels: [], schemaVersion: 1 } as unknown as Dashboard,
      folderUid: 'folder-1',
    };

    const store = createTestStore();
    await store.dispatch(browseDashboardsAPI.endpoints.saveDashboard.initiate(cmd));

    expect(getDashboardAPIMock).toHaveBeenCalledWith('v1');
    expect(saveDashboardV1).toHaveBeenCalledWith(cmd);
    expect(saveDashboardV2).not.toHaveBeenCalled();
  });

  it('uses v2 dashboard API for v2 dashboards', async () => {
    const saveDashboardV1 = jest.fn().mockResolvedValue({ uid: 'test-uid-v1' });
    const saveDashboardV2 = jest.fn().mockResolvedValue({ uid: 'test-uid-v2' });

    getDashboardAPIMock.mockImplementation((version?: 'v1' | 'v2') => {
      if (version === 'v1') {
        return createMockDashboardAPI(saveDashboardV1);
      }
      if (version === 'v2') {
        return createMockDashboardAPI(saveDashboardV2);
      }
      return createMockDashboardAPI(jest.fn());
    });

    const v2Dashboard: DashboardV2Spec = { title: 'V2', elements: [] } as unknown as DashboardV2Spec;
    const cmd: SaveDashboardCommand<DashboardV2Spec> = {
      dashboard: v2Dashboard,
      folderUid: 'folder-2',
    };

    const store = createTestStore();
    await store.dispatch(browseDashboardsAPI.endpoints.saveDashboard.initiate(cmd));

    expect(getDashboardAPIMock).toHaveBeenCalledWith('v2');
    expect(saveDashboardV2).toHaveBeenCalledWith(cmd);
    expect(saveDashboardV1).not.toHaveBeenCalled();
  });
});

describe('browseDashboardsAPI bulk move/delete error handling', () => {
  const getDashboardAPIMock = jest.mocked(getDashboardAPI);
  const invalidateQuotaUsageMock = jest.mocked(invalidateQuotaUsage);

  const createBulkTestStore = () =>
    configureStore({
      reducer: {
        [browseDashboardsAPI.reducerPath]: browseDashboardsAPI.reducer,
        appNotifications: appNotificationsReducer,
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(browseDashboardsAPI.middleware),
    });

  let bulkStore: ReturnType<typeof createBulkTestStore>;

  beforeEach(() => {
    getDashboardAPIMock.mockReset();
    mockFetch.mockReset();
    invalidateQuotaUsageMock.mockClear();
    bulkStore = createBulkTestStore();
    setStore(bulkStore as unknown as Store);
  });

  it('moveFolders records per-folder failures and continues', async () => {
    const fetchError = {
      status: 403,
      statusText: 'Forbidden',
      data: { message: 'no permission' },
      config: { url: '/api/folders/b/move' },
    };
    mockFetch
      .mockImplementationOnce(() => of(createFetchResponse({})))
      .mockImplementationOnce(
        () =>
          new Observable((subscriber) => {
            subscriber.error(fetchError);
          })
      );

    const result = await bulkStore.dispatch(
      browseDashboardsAPI.endpoints.moveFolders.initiate({
        folderUIDs: ['folder-a', 'folder-b'],
        destinationUID: 'dest',
      })
    );

    expect(result.data?.succeededUIDs).toEqual(['folder-a']);
    expect(result.data?.failed).toHaveLength(1);
    expect(result.data?.failed[0].uid).toBe('folder-b');
    expect(result.data?.failed[0].message).toContain('no permission');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('deleteFolders records per-folder failures and continues', async () => {
    const fetchError = {
      status: 500,
      statusText: 'Server Error',
      data: { message: 'internal error' },
      config: { url: '/api/folders/y' },
    };
    mockFetch
      .mockImplementationOnce(() => of(createFetchResponse({})))
      .mockImplementationOnce(
        () =>
          new Observable((subscriber) => {
            subscriber.error(fetchError);
          })
      );

    const result = await bulkStore.dispatch(
      browseDashboardsAPI.endpoints.deleteFolders.initiate({ folderUIDs: ['folder-x', 'folder-y'] })
    );

    expect(result.data?.succeededUIDs).toEqual(['folder-x']);
    expect(result.data?.failed).toHaveLength(1);
    expect(result.data?.failed[0].uid).toBe('folder-y');
  });

  it('moveDashboards catches save errors per dashboard', async () => {
    const saveDashboard = jest
      .fn()
      .mockResolvedValueOnce({ uid: 'd1' })
      .mockRejectedValueOnce(new Error('version mismatch'));
    const getDashboardDTO = jest.fn().mockImplementation((uid: string) =>
      Promise.resolve({
        kind: 'DashboardWithAccessInfo',
        spec: { title: uid, elements: [] },
        metadata: { name: uid },
      })
    );
    getDashboardAPIMock.mockResolvedValue({ getDashboardDTO, saveDashboard } as unknown as ReturnType<
      typeof getDashboardAPI
    >);

    const result = await bulkStore.dispatch(
      browseDashboardsAPI.endpoints.moveDashboards.initiate({
        dashboardUIDs: ['d1', 'd2'],
        destinationUID: 'dest',
      })
    );

    expect(result.data?.succeededUIDs).toEqual(['d1']);
    expect(result.data?.failed).toEqual([{ uid: 'd2', message: 'version mismatch' }]);
  });

  it('deleteDashboards catches delete errors per dashboard', async () => {
    const deleteDashboard = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('not found'));
    const getDashboardDTO = jest.fn();
    getDashboardAPIMock.mockResolvedValue({
      getDashboardDTO,
      deleteDashboard,
    } as unknown as ReturnType<typeof getDashboardAPI>);

    const result = await bulkStore.dispatch(
      browseDashboardsAPI.endpoints.deleteDashboards.initiate({ dashboardUIDs: ['a', 'b'] })
    );

    expect(result.data?.succeededUIDs).toEqual(['a']);
    expect(result.data?.failed).toEqual([{ uid: 'b', message: 'not found' }]);
  });

  it('shows warning notification on partial folder move failure', async () => {
    const fetchError = {
      status: 400,
      data: { message: 'bad request' },
      config: {},
    };
    mockFetch
      .mockImplementationOnce(() => of(createFetchResponse({})))
      .mockImplementationOnce(
        () =>
          new Observable((subscriber) => {
            subscriber.error(fetchError);
          })
      );

    await bulkStore.dispatch(
      browseDashboardsAPI.endpoints.moveFolders.initiate({
        folderUIDs: ['ok', 'bad'],
        destinationUID: 'dest',
      })
    );

    const state = bulkStore.getState();
    const notifications = Object.values(state.appNotifications.byId);
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications.some((n) => n.severity === 'warning')).toBe(true);
  });
});
