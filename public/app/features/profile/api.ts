import { getBackendSrv } from '@grafana/runtime';
import { type Team } from 'app/types/teams';
import { type UserDTO, type UserOrg, type UserSession } from 'app/types/user';
import { isOrgsApiEnabled, orgMembershipUrl } from 'app/features/search/api/orgApis';
import { contextSrv } from 'app/core/services/context_srv';

import { isUserSelfServiceApisEnabled, ownUserUrl } from './apisAdapter';
import { type ChangePasswordFields, type ProfileUpdateFields } from './types';

async function changePassword(payload: ChangePasswordFields): Promise<void> {
  try {
    if (isUserSelfServiceApisEnabled()) {
      await getBackendSrv().put(ownUserUrl('password'), {
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

function loadUser(): Promise<UserDTO> {
  return getBackendSrv().get('/api/user');
}

function loadTeams(): Promise<Team[]> {
  if (isUserSelfServiceApisEnabled()) {
    return getBackendSrv().get(ownUserUrl('teams'));
  }
  return getBackendSrv().get('/api/user/teams');
}

async function loadOrgs(): Promise<UserOrg[]> {
  if (isOrgsApiEnabled()) {
    const uid = contextSrv.user.uid;
    const list = await getBackendSrv().get<{
      items?: Array<{ spec?: { orgRef?: string; orgName?: string; role?: string } }>;
    }>(`${orgMembershipUrl()}?fieldSelector=spec.userRef=${uid}`);
    return (list.items ?? []).map((item) => ({
      orgId: Number(item.spec?.orgRef),
      name: item.spec?.orgName || item.spec?.orgRef || '',
      role: item.spec?.role ?? '',
    })) as UserOrg[];
  }
  return getBackendSrv().get('/api/user/orgs');
}

async function loadSessions(): Promise<UserSession[]> {
  if (isUserSelfServiceApisEnabled()) {
    const list = await getBackendSrv().get<{ items?: UserSession[] }>(ownUserUrl('sessions'));
    return list.items ?? [];
  }
  return getBackendSrv().get('/api/user/auth-tokens');
}

async function revokeUserSession(tokenId: number): Promise<void> {
  if (isUserSelfServiceApisEnabled()) {
    await getBackendSrv().delete(`${ownUserUrl('sessions')}?authTokenId=${tokenId}`);
    return;
  }
  await getBackendSrv().post('/api/user/revoke-auth-token', {
    authTokenId: tokenId,
  });
}

async function setUserOrg(org: UserOrg): Promise<void> {
  if (isUserSelfServiceApisEnabled()) {
    await getBackendSrv().post(ownUserUrl('context'), { orgId: org.orgId });
    return;
  }
  await getBackendSrv().post('/api/user/using/' + org.orgId, {});
}

async function updateUserProfile(payload: ProfileUpdateFields): Promise<void> {
  try {
    if (isUserSelfServiceApisEnabled()) {
      await getBackendSrv().patch(ownUserUrl(), { spec: payload });
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
