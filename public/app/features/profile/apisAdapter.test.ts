import { config } from '@grafana/runtime';
import { contextSrv } from 'app/core/services/context_srv';

import { isUserSelfServiceApisEnabled, ownUserUrl } from './apisAdapter';

jest.mock('@grafana/api-clients', () => ({
  getAPIBaseURL: (group: string, version: string) => `/apis/${group}/${version}/namespaces/default`,
}));

describe('profile apisAdapter', () => {
  const originalFlag = config.featureToggles.kubernetesUsersApi;
  const originalUid = contextSrv.user.uid;

  afterEach(() => {
    config.featureToggles.kubernetesUsersApi = originalFlag;
    contextSrv.user.uid = originalUid;
  });

  it('builds self-service subresource URLs for the signed-in user', () => {
    contextSrv.user.uid = 'abc';
    expect(ownUserUrl()).toBe('/apis/iam.grafana.app/v0alpha1/namespaces/default/users/abc');
    expect(ownUserUrl('password')).toBe('/apis/iam.grafana.app/v0alpha1/namespaces/default/users/abc/password');
    expect(ownUserUrl('context')).toBe('/apis/iam.grafana.app/v0alpha1/namespaces/default/users/abc/context');
    expect(ownUserUrl('sessions')).toBe('/apis/iam.grafana.app/v0alpha1/namespaces/default/users/abc/sessions');
    expect(ownUserUrl('teams')).toBe('/apis/iam.grafana.app/v0alpha1/namespaces/default/users/abc/teams');
  });

  it('is off unless kubernetesUsersApi is enabled', () => {
    config.featureToggles.kubernetesUsersApi = false;
    expect(isUserSelfServiceApisEnabled()).toBe(false);
    config.featureToggles.kubernetesUsersApi = true;
    expect(isUserSelfServiceApisEnabled()).toBe(true);
  });
});
