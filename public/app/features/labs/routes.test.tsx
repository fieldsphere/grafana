import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import { getRoutes } from './routes';

jest.mock('app/core/services/context_srv', () => ({
  contextSrv: {
    evaluatePermission: jest.fn(),
  },
}));

describe('Labs routes', () => {
  it('registers the Labs route behind settings read access', () => {
    jest.mocked(contextSrv.evaluatePermission).mockReturnValue([]);

    const [route] = getRoutes();

    expect(route.path).toBe('/labs/*');
    expect(route.roles?.()).toEqual([]);
    expect(contextSrv.evaluatePermission).toHaveBeenCalledWith([AccessControlAction.SettingsRead]);
  });
});
