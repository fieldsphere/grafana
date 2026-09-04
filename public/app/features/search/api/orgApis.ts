import { config } from '@grafana/runtime';

const ORG_API_GROUP = 'org.grafana.app';
const ORG_API_VERSION = 'v0alpha1';

export function isOrgsApiEnabled(): boolean {
  return Boolean(config.featureToggles.kubernetesOrgsApi);
}

export function orgResourceUrl(name?: string): string {
  const base = `/apis/${ORG_API_GROUP}/${ORG_API_VERSION}/organizations`;
  return name ? `${base}/${name}` : base;
}

export function orgMembershipUrl(name?: string): string {
  const base = `/apis/${ORG_API_GROUP}/${ORG_API_VERSION}/orgmemberships`;
  return name ? `${base}/${name}` : base;
}

export function membershipName(orgId: number, userRef: string): string {
  return `${orgId}.${userRef}`;
}
