import { config, getBackendSrv } from '@grafana/runtime';
import { contextSrv } from 'app/core/services/context_srv';
import { type Team } from 'app/types/teams';
import { type UserDTO, type UserOrg, type UserSession } from 'app/types/user';

import { type ChangePasswordFields, type ProfileUpdateFields } from './types';

export function isKubernetesUsersApiEnabled(): boolean {
  return Boolean(config.featureToggles.kubernetesUsersApi);
}

function iamBaseURL(): string {
  return `/apis/iam.grafana.app/v0alpha1/namespaces/${config.namespace}`;
}

function currentUserUID(): string {
  return contextSrv.user.uid;
}

interface IamUser {
  metadata?: { name?: string };
  spec?: {
    title?: string;
    login?: string;
    email?: string;
    grafanaAdmin?: boolean;
    disabled?: boolean;
    role?: string;
  };
  status?: { lastSeenAt?: number };
}

interface IamUserOrgList {
  items?: Array<{ orgId: number; name: string; role: string }>;
}

interface IamUserTeamList {
  items?: Array<{
    title?: string;
    teamRef?: { name?: string };
    permission?: string;
  }>;
}

interface IamUserTokenList {
  items?: Array<{
    id: number;
    createdAt?: string;
    seenAt?: string;
    clientIp?: string;
    userAgent?: string;
    authModule?: string;
    isActive?: boolean;
  }>;
}

function iamUserToDTO(user: IamUser): UserDTO {
  return {
    uid: user.metadata?.name || currentUserUID(),
    id: contextSrv.user.id,
    login: user.spec?.login || '',
    email: user.spec?.email || '',
    name: user.spec?.title || user.spec?.login || '',
    isGrafanaAdmin: Boolean(user.spec?.grafanaAdmin),
    isDisabled: Boolean(user.spec?.disabled),
    orgId: contextSrv.user.orgId,
    orgName: contextSrv.user.orgName,
    orgRole: (user.spec?.role || contextSrv.user.orgRole) as UserDTO['orgRole'],
  } as UserDTO;
}

async function changePassword(payload: ChangePasswordFields): Promise<void> {
  try {
    if (isKubernetesUsersApiEnabled()) {
      await getBackendSrv().post(`${iamBaseURL()}/users/${currentUserUID()}/password`, {
        oldPassword: payload.oldPassword,
        newPassword: payload.newPassword,
      });
      return;
    }
    await getBackendSrv().put('/api/user/password', payload);
  } catch (err) {
    console.error(err);
  }
}

async function loadUser(): Promise<UserDTO> {
  if (isKubernetesUsersApiEnabled()) {
    const user = await getBackendSrv().get<IamUser>(`${iamBaseURL()}/users/${currentUserUID()}`);
    return iamUserToDTO(user);
  }
  return getBackendSrv().get('/api/user');
}

async function loadTeams(): Promise<Team[]> {
  if (isKubernetesUsersApiEnabled()) {
    const response = await getBackendSrv().get<IamUserTeamList>(
      `${iamBaseURL()}/users/${currentUserUID()}/teams`
    );
    return (response.items || []).map((item, index) => ({
      id: index,
      uid: item.teamRef?.name || '',
      name: item.title || item.teamRef?.name || '',
      email: '',
      avatarUrl: '',
      memberCount: 0,
      permission: 0,
    })) as Team[];
  }
  return getBackendSrv().get('/api/user/teams');
}

async function loadOrgs(): Promise<UserOrg[]> {
  if (isKubernetesUsersApiEnabled()) {
    const response = await getBackendSrv().get<IamUserOrgList>(
      `${iamBaseURL()}/users/${currentUserUID()}/orgs`
    );
    return (response.items || []).map((item) => ({
      orgId: item.orgId,
      name: item.name,
      role: item.role as UserOrg['role'],
    }));
  }
  return getBackendSrv().get('/api/user/orgs');
}

async function loadSessions(): Promise<UserSession[]> {
  if (isKubernetesUsersApiEnabled()) {
    const response = await getBackendSrv().get<IamUserTokenList>(
      `${iamBaseURL()}/users/${currentUserUID()}/tokens`
    );
    return (response.items || []).map((item) => ({
      id: item.id,
      createdAt: item.createdAt || '',
      clientIp: item.clientIp || '',
      userAgent: item.userAgent || '',
      authModule: item.authModule,
      isActive: Boolean(item.isActive),
      seenAt: item.seenAt || '',
      browser: '',
      browserVersion: '',
      os: '',
      osVersion: '',
      device: '',
    })) as UserSession[];
  }
  return getBackendSrv().get('/api/user/auth-tokens');
}

async function revokeUserSession(tokenId: number): Promise<void> {
  if (isKubernetesUsersApiEnabled()) {
    await getBackendSrv().post(`${iamBaseURL()}/users/${currentUserUID()}/tokens`, {
      authTokenId: tokenId,
    });
    return;
  }
  await getBackendSrv().post('/api/user/revoke-auth-token', {
    authTokenId: tokenId,
  });
}

async function setUserOrg(org: UserOrg): Promise<void> {
  if (isKubernetesUsersApiEnabled()) {
    await getBackendSrv().post(`${iamBaseURL()}/users/${currentUserUID()}/using/${org.orgId}`, {});
    return;
  }
  await getBackendSrv().post('/api/user/using/' + org.orgId, {});
}

async function updateUserProfile(payload: ProfileUpdateFields): Promise<void> {
  try {
    if (isKubernetesUsersApiEnabled()) {
      // Theme stays on legacy /api until IAM User.spec supports it.
      await getBackendSrv().put('/api/user', payload);
      return;
    }
    await getBackendSrv().put('/api/user', payload);
  } catch (err) {
    console.error(err);
  }
}

export const api = {
  changePassword,
  revokeUserSession,
  loadUser,
  loadSessions,
  loadOrgs,
  loadTeams,
  setUserOrg,
  updateUserProfile,
};
