import { waitFor } from '@testing-library/react';
import { render } from 'test/test-utils';

import { locationUtil } from '@grafana/data';
import { getBackendSrv, locationService } from '@grafana/runtime';

import HomePage from './HomePage';

const getMock = jest.fn();

jest.mock('@grafana/runtime', () => {
  const actual = jest.requireActual('@grafana/runtime');

  return {
    ...actual,
    getBackendSrv: jest.fn(),
    locationService: {
      ...actual.locationService,
      replace: jest.fn(),
    },
  };
});

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getBackendSrv as jest.Mock).mockReturnValue({ get: getMock });
  });

  it('redirects to custom home dashboard when API returns redirect URI', async () => {
    const processRedirectUriSpy = jest.spyOn(locationUtil, 'processRedirectUri').mockReturnValue('/d/custom-home');
    getMock.mockResolvedValue({ redirectUri: '/d/custom-home' });

    render(<HomePage />);

    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/api/dashboards/home'));
    await waitFor(() => expect(locationService.replace).toHaveBeenCalledWith('/d/custom-home'));
    expect(processRedirectUriSpy).toHaveBeenCalledWith('/d/custom-home', locationService.getLocation());
  });

  it('does not redirect when API returns the default home dashboard', async () => {
    getMock.mockResolvedValue({ dashboard: {}, meta: {} });

    render(<HomePage />);

    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/api/dashboards/home'));
    expect(locationService.replace).not.toHaveBeenCalled();
  });
});
