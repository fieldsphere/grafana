import { config, getBackendSrv } from '@grafana/runtime';

import { isKubernetesUsersApiEnabled, lookupOrgUsers, removeOrgUser, searchOrgUsers, updateOrgUserRole } from './api';

jest.mock('@grafana/runtime', () => ({
  config: {
    namespace: 'default',
    featureToggles: {},
  },
  getBackendSrv: jest.fn(),
}));

jest.mock('app/core/services/context_srv', () => ({
  contextSrv: {
    user: { orgId: 1 },
  },
}));

const getBackendSrvMock = getBackendSrv as jest.MockedFunction<typeof getBackendSrv>;

describe('users/api dual-path', () => {
  const get = jest.fn();
  const patch = jest.fn();
  const del = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    config.featureToggles = {};
    getBackendSrvMock.mockReturnValue({ get, patch, delete: del } as never);
  });

  it('reports kubernetesUsersApi as disabled by default', () => {
    expect(isKubernetesUsersApiEnabled()).toBe(false);
  });

  describe('when kubernetesUsersApi is off', () => {
    it('searchOrgUsers calls legacy /api/org/users/search', async () => {
      get.mockResolvedValue({ orgUsers: [], totalCount: 0, page: 1, perPage: 50 });
      await searchOrgUsers({ perPage: 50, page: 1, query: 'alice' });
      expect(get).toHaveBeenCalledWith(
        '/api/org/users/search',
        expect.objectContaining({ perpage: 50, page: 1, query: 'alice' })
      );
    });

    it('updateOrgUserRole patches legacy /api/org/users/:id', async () => {
      patch.mockResolvedValue(undefined);
      await updateOrgUserRole({ userId: 7, uid: 'u7', role: 'Editor' } as never);
      expect(patch).toHaveBeenCalledWith('/api/org/users/7', { role: 'Editor' });
    });

    it('removeOrgUser deletes legacy /api/org/users/:id', async () => {
      del.mockResolvedValue(undefined);
      await removeOrgUser({ userId: 7, uid: 'u7' });
      expect(del).toHaveBeenCalledWith('/api/org/users/7');
    });

    it('lookupOrgUsers calls legacy lookup', async () => {
      get.mockResolvedValue([]);
      await lookupOrgUsers('bob');
      expect(get).toHaveBeenCalledWith('/api/org/users/lookup?query=bob&limit=100');
    });
  });

  describe('when kubernetesUsersApi is on', () => {
    beforeEach(() => {
      config.featureToggles = { kubernetesUsersApi: true };
    });

    it('searchOrgUsers calls IAM searchUsers and maps hits', async () => {
      get.mockResolvedValue({
        totalHits: 1,
        hits: [
          {
            name: 'uid-alice',
            title: 'Alice',
            login: 'alice',
            email: 'a@example.com',
            role: 'Admin',
            internalId: 42,
            lastSeenAtAge: '1d',
          },
        ],
      });

      const result = await searchOrgUsers({ perPage: 50, page: 1, query: 'alice' });

      expect(get).toHaveBeenCalledWith(
        '/apis/iam.grafana.app/v0alpha1/namespaces/default/searchUsers',
        expect.objectContaining({ limit: 50, page: 1, query: 'alice' })
      );
      expect(result.orgUsers).toHaveLength(1);
      expect(result.orgUsers[0]).toMatchObject({
        uid: 'uid-alice',
        userId: 42,
        login: 'alice',
        role: 'Admin',
      });
      expect(result.totalCount).toBe(1);
    });

    it('updateOrgUserRole patches IAM User by uid', async () => {
      patch.mockResolvedValue(undefined);
      await updateOrgUserRole({ userId: 7, uid: 'u7', role: 'Editor' } as never);
      expect(patch).toHaveBeenCalledWith(
        '/apis/iam.grafana.app/v0alpha1/namespaces/default/users/u7',
        { spec: { role: 'Editor' } },
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
    });

    it('removeOrgUser deletes IAM User by uid', async () => {
      del.mockResolvedValue(undefined);
      await removeOrgUser({ userId: 7, uid: 'u7' });
      expect(del).toHaveBeenCalledWith('/apis/iam.grafana.app/v0alpha1/namespaces/default/users/u7');
    });

    it('lookupOrgUsers calls IAM searchUsers', async () => {
      get.mockResolvedValue({
        hits: [{ name: 'uid-bob', login: 'bob', email: 'b@x.com', role: 'Viewer', internalId: 9 }],
      });
      const users = await lookupOrgUsers('bob');
      expect(get).toHaveBeenCalledWith(
        '/apis/iam.grafana.app/v0alpha1/namespaces/default/searchUsers',
        expect.objectContaining({ query: 'bob', limit: 100 })
      );
      expect(users[0]).toMatchObject({ uid: 'uid-bob', userId: 9, login: 'bob' });
    });
  });
});
