import { type OrgRole } from '@grafana/data';
import { config, getBackendSrv } from '@grafana/runtime';
import { accessControlQueryParam } from 'app/core/utils/accessControl';
import { contextSrv } from 'app/core/services/context_srv';
import { type OrgUser } from 'app/types/user';

/** IAM search hit shape from /apis/iam.grafana.app/.../searchUsers */
export interface SearchUsersHit {
  name: string;
  title?: string;
  login: string;
  email: string;
  role: string;
  lastSeenAt?: number;
  lastSeenAtAge?: string;
  provisioned?: boolean;
  disabled?: boolean;
  internalId: number;
  created?: number;
  accessControl?: Record<string, boolean>;
  externalAuthModules?: string[];
}

interface SearchUsersResponse {
  hits?: SearchUsersHit[];
  totalHits?: number;
}

interface OrgUsersSearchResult {
  orgUsers: OrgUser[];
  totalCount: number;
  page: number;
  perPage: number;
}

export function isKubernetesUsersApiEnabled(): boolean {
  return Boolean(config.featureToggles.kubernetesUsersApi);
}

function iamBaseURL(): string {
  return `/apis/iam.grafana.app/v0alpha1/namespaces/${config.namespace}`;
}

function searchHitToOrgUser(hit: SearchUsersHit): OrgUser {
  return {
    uid: hit.name,
    userId: hit.internalId,
    login: hit.login,
    email: hit.email,
    name: hit.title || hit.login,
    role: hit.role as OrgRole,
    orgId: contextSrv.user.orgId,
    avatarUrl: '',
    lastSeenAt: hit.lastSeenAt ? new Date(hit.lastSeenAt).toISOString() : '',
    lastSeenAtAge: hit.lastSeenAtAge || '',
    isDisabled: Boolean(hit.disabled),
    isProvisioned: Boolean(hit.provisioned),
    accessControl: hit.accessControl,
    authLabels: hit.externalAuthModules,
  };
}

/**
 * Search org users. When kubernetesUsersApi is on, calls IAM searchUsers;
 * otherwise the legacy /api/org/users/search endpoint (default).
 */
export async function searchOrgUsers(params: {
  perPage: number;
  page: number;
  query?: string;
  sort?: string;
}): Promise<OrgUsersSearchResult> {
  if (isKubernetesUsersApiEnabled()) {
    const response = await getBackendSrv().get<SearchUsersResponse>(
      `${iamBaseURL()}/searchUsers`,
      accessControlQueryParam({
        limit: params.perPage,
        page: params.page,
        query: params.query,
        sort: params.sort,
        accesscontrol: true,
      })
    );
    const hits = response.hits ?? [];
    return {
      orgUsers: hits.map(searchHitToOrgUser),
      totalCount: response.totalHits ?? hits.length,
      page: params.page,
      perPage: params.perPage,
    };
  }

  return getBackendSrv().get(
    `/api/org/users/search`,
    accessControlQueryParam({
      perpage: params.perPage,
      page: params.page,
      query: params.query,
      sort: params.sort,
    })
  );
}

/**
 * Update an org user's role. IAM path patches User.spec.role by UID.
 */
export async function updateOrgUserRole(user: OrgUser): Promise<void> {
  if (isKubernetesUsersApiEnabled() && user.uid) {
    await getBackendSrv().patch(
      `${iamBaseURL()}/users/${user.uid}`,
      { spec: { role: user.role } },
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    );
    return;
  }
  await getBackendSrv().patch(`/api/org/users/${user.userId}`, { role: user.role });
}

/**
 * Remove an org user. IAM path deletes the User resource by UID (single-org).
 */
export async function removeOrgUser(user: { userId: number; uid?: string }): Promise<void> {
  if (isKubernetesUsersApiEnabled() && user.uid) {
    await getBackendSrv().delete(`${iamBaseURL()}/users/${user.uid}`);
    return;
  }
  await getBackendSrv().delete(`/api/org/users/${user.userId}`);
}

/**
 * Lookup users for pickers. IAM path uses searchUsers; default stays on /api lookup.
 */
export async function lookupOrgUsers(query: string, limit = 100): Promise<Array<Partial<OrgUser>>> {
  if (isKubernetesUsersApiEnabled()) {
    const response = await getBackendSrv().get<SearchUsersResponse>(`${iamBaseURL()}/searchUsers`, {
      query,
      limit,
    });
    return (response.hits ?? []).map((hit) => ({
      uid: hit.name,
      userId: hit.internalId,
      login: hit.login,
      avatarUrl: '',
    }));
  }

  return getBackendSrv().get(`/api/org/users/lookup?query=${encodeURIComponent(query)}&limit=${limit}`);
}
