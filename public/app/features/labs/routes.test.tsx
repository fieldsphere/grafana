import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import { ROUTES } from './constants';
import { getLabsRoutes } from './routes';

describe('labs route guards', () => {
  const previousPermissions = contextSrv.user.permissions;

  afterEach(() => {
    contextSrv.user.permissions = previousPermissions;
  });

  function getRouteRolesGuard(path: string) {
    const route = getLabsRoutes().find((route) => route.path === path);
    if (!route?.roles) {
      throw new Error(`Route not found or has no roles guard: ${path}`);
    }

    return route.roles;
  }

  it('rejects users without settings read permission', () => {
    contextSrv.user.permissions = {};

    expect(getRouteRolesGuard(ROUTES.FeatureFlags)()).toEqual(['Reject']);
  });

  it('allows users with settings read permission', () => {
    contextSrv.user.permissions = {
      [AccessControlAction.SettingsRead]: true,
    };

    expect(getRouteRolesGuard(ROUTES.FeatureFlags)()).toEqual([]);
  });
});
