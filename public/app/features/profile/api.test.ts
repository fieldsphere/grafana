import { config, getBackendSrv } from '@grafana/runtime';
import { contextSrv } from 'app/core/services/context_srv';

import { api } from './api';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
}));

jest.mock('@grafana/api-clients', () => ({
  getAPIBaseURL: (group: string, version: string) => `/apis/${group}/${version}/namespaces/default`,
}));

describe('profile api loadOrgs', () => {
  const originalOrgsFlag = config.featureToggles.kubernetesOrgsApi;
  const originalUid = contextSrv.user.uid;

  afterEach(() => {
    config.featureToggles.kubernetesOrgsApi = originalOrgsFlag;
    contextSrv.user.uid = originalUid;
    jest.resetAllMocks();
  });

  it('maps membership orgName onto UserOrg.name when kubernetesOrgsApi is on', async () => {
    config.featureToggles.kubernetesOrgsApi = true;
    contextSrv.user.uid = 'u4';
    const get = jest.fn().mockResolvedValue({
      items: [{ spec: { orgRef: '12', orgName: 'Ops', role: 'Editor' } }],
    });
    (getBackendSrv as jest.Mock).mockReturnValue({ get });

    await expect(api.loadOrgs()).resolves.toEqual([{ orgId: 12, name: 'Ops', role: 'Editor' }]);
    expect(get).toHaveBeenCalledWith('/apis/org.grafana.app/v0alpha1/orgmemberships?fieldSelector=spec.userRef=u4');
  });
});
