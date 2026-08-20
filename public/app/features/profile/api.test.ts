import { config, getBackendSrv } from '@grafana/runtime';

import { api, isKubernetesUsersApiEnabled } from './api';

jest.mock('@grafana/runtime', () => ({
  config: {
    namespace: 'default',
    featureToggles: {},
  },
  getBackendSrv: jest.fn(),
}));

jest.mock('app/core/services/context_srv', () => ({
  contextSrv: {
    user: {
      uid: 'u-test',
      id: 7,
      orgId: 1,
      orgName: 'Main',
      orgRole: 'Admin',
    },
  },
}));

describe('profile api dual-path', () => {
  const get = jest.fn();
  const post = jest.fn();
  const put = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getBackendSrv as jest.Mock).mockReturnValue({ get, post, put });
    (config as { featureToggles: Record<string, boolean> }).featureToggles = {};
  });

  it('uses legacy /api endpoints by default', async () => {
    expect(isKubernetesUsersApiEnabled()).toBe(false);
    get.mockResolvedValueOnce({ login: 'admin' });
    await api.loadUser();
    expect(get).toHaveBeenCalledWith('/api/user');

    get.mockResolvedValueOnce([]);
    await api.loadOrgs();
    expect(get).toHaveBeenCalledWith('/api/user/orgs');

    get.mockResolvedValueOnce([]);
    await api.loadTeams();
    expect(get).toHaveBeenCalledWith('/api/user/teams');

    get.mockResolvedValueOnce([]);
    await api.loadSessions();
    expect(get).toHaveBeenCalledWith('/api/user/auth-tokens');
  });

  it('uses IAM /apis endpoints when kubernetesUsersApi is on', async () => {
    (config as { featureToggles: Record<string, boolean> }).featureToggles = {
      kubernetesUsersApi: true,
    };
    expect(isKubernetesUsersApiEnabled()).toBe(true);

    get.mockResolvedValueOnce({
      metadata: { name: 'u-test' },
      spec: { login: 'admin', email: 'a@b.c', title: 'Admin' },
    });
    await api.loadUser();
    expect(get).toHaveBeenCalledWith('/apis/iam.grafana.app/v0alpha1/namespaces/default/users/u-test');

    get.mockResolvedValueOnce({ items: [{ orgId: 1, name: 'Main', role: 'Admin' }] });
    await api.loadOrgs();
    expect(get).toHaveBeenCalledWith(
      '/apis/iam.grafana.app/v0alpha1/namespaces/default/users/u-test/orgs'
    );

    get.mockResolvedValueOnce({ items: [] });
    await api.loadTeams();
    expect(get).toHaveBeenCalledWith(
      '/apis/iam.grafana.app/v0alpha1/namespaces/default/users/u-test/teams'
    );

    get.mockResolvedValueOnce({
      items: [
        {
          id: 9,
          createdAt: '2026-01-01T00:00:00Z',
          seenAt: '2026-01-02T00:00:00Z',
          clientIp: '1.2.3.4',
          userAgent: 'Chrome on Mac OS X',
          isActive: true,
          browser: 'Chrome',
          browserVersion: '120.0',
          os: 'Mac OS X',
          osVersion: '10.15',
          device: 'Mac',
        },
      ],
    });
    const sessions = await api.loadSessions();
    expect(get).toHaveBeenCalledWith(
      '/apis/iam.grafana.app/v0alpha1/namespaces/default/users/u-test/tokens'
    );
    expect(sessions).toEqual([
      {
        id: 9,
        createdAt: '2026-01-01T00:00:00Z',
        clientIp: '1.2.3.4',
        userAgent: 'Chrome on Mac OS X',
        authModule: undefined,
        isActive: true,
        seenAt: '2026-01-02T00:00:00Z',
        browser: 'Chrome',
        browserVersion: '120.0',
        os: 'Mac OS X',
        osVersion: '10.15',
        device: 'Mac',
      },
    ]);

    post.mockResolvedValueOnce({});
    await api.setUserOrg({ orgId: 2, name: 'Other', role: 'Viewer' });
    expect(post).toHaveBeenCalledWith(
      '/apis/iam.grafana.app/v0alpha1/namespaces/default/users/u-test/using/2',
      {}
    );

    post.mockResolvedValueOnce({});
    await api.revokeUserSession(9);
    expect(post).toHaveBeenCalledWith(
      '/apis/iam.grafana.app/v0alpha1/namespaces/default/users/u-test/tokens',
      { authTokenId: 9 }
    );
  });
});
