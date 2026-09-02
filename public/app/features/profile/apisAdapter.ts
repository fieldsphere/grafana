import { getAPIBaseURL } from '@grafana/api-clients';
import { config } from '@grafana/runtime';
import { contextSrv } from 'app/core/services/context_srv';

const IAM_GROUP = 'iam.grafana.app';
const IAM_VERSION = 'v0alpha1';

export function isUserSelfServiceApisEnabled(): boolean {
  return Boolean(config.featureToggles.kubernetesUsersApi);
}

export function ownUserUrl(subresource?: string): string {
  const uid = contextSrv.user.uid;
  const base = `${getAPIBaseURL(IAM_GROUP, IAM_VERSION)}/users/${uid}`;
  return subresource ? `${base}/${subresource}` : base;
}
