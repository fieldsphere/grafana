import { createStructuredLogger, getBackendSrv } from '@grafana/runtime';
import { Team } from 'app/types/teams';

const logger = createStructuredLogger('ProfileAPI');
import { UserDTO, UserOrg, UserSession } from 'app/types/user';

import { ChangePasswordFields, ProfileUpdateFields } from './types';

async function changePassword(payload: ChangePasswordFields): Promise<void> {
  try {
    await getBackendSrv().put('/api/user/password', payload);
  } catch (err) {
    logger.error('Failed to change password', err instanceof Error ? err : undefined);
  }
}

function loadUser(): Promise<UserDTO> {
  return getBackendSrv().get('/api/user');
}

function loadTeams(): Promise<Team[]> {
  return getBackendSrv().get('/api/user/teams');
}

function loadOrgs(): Promise<UserOrg[]> {
  return getBackendSrv().get('/api/user/orgs');
}

function loadSessions(): Promise<UserSession[]> {
  return getBackendSrv().get('/api/user/auth-tokens');
}

async function revokeUserSession(tokenId: number): Promise<void> {
  await getBackendSrv().post('/api/user/revoke-auth-token', {
    authTokenId: tokenId,
  });
}

async function setUserOrg(org: UserOrg): Promise<void> {
  await getBackendSrv().post('/api/user/using/' + org.orgId, {});
}

async function updateUserProfile(payload: ProfileUpdateFields): Promise<void> {
  try {
    await getBackendSrv().put('/api/user', payload);
  } catch (err) {
    logger.error('Failed to update user profile', err instanceof Error ? err : undefined);
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
