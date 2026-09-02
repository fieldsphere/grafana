import { config } from '@grafana/runtime';

import { isOrgsApiEnabled, membershipName, orgMembershipUrl, orgResourceUrl } from './orgApis';

describe('orgApis', () => {
  const original = config.featureToggles.kubernetesOrgsApi;

  afterEach(() => {
    config.featureToggles.kubernetesOrgsApi = original;
  });

  it('builds cluster-scoped organization and membership URLs', () => {
    expect(orgResourceUrl()).toBe('/apis/org.grafana.app/v0alpha1/organizations');
    expect(orgResourceUrl('7')).toBe('/apis/org.grafana.app/v0alpha1/organizations/7');
    expect(orgMembershipUrl('7.uid-1')).toBe('/apis/org.grafana.app/v0alpha1/orgmemberships/7.uid-1');
    expect(membershipName(7, 'uid-1')).toBe('7.uid-1');
  });

  it('is off unless kubernetesOrgsApi is enabled', () => {
    config.featureToggles.kubernetesOrgsApi = false;
    expect(isOrgsApiEnabled()).toBe(false);
    config.featureToggles.kubernetesOrgsApi = true;
    expect(isOrgsApiEnabled()).toBe(true);
  });
});
