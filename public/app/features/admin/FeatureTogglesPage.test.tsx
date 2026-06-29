import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppEvents } from '@grafana/data';
import { getAppEvents, getBackendSrv } from '@grafana/runtime';

import { TestProvider } from '../../../test/helpers/TestProvider';
import { contextSrv } from '../../core/services/context_srv';

const mockGet = jest.fn();
const mockPut = jest.fn();
const mockPublish = jest.fn();

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
  getAppEvents: jest.fn(),
}));

const renderPage = () => {
  const { default: FeatureTogglesPage } = require('./FeatureTogglesPage');
  render(
    <TestProvider>
      <FeatureTogglesPage />
    </TestProvider>
  );
};

describe('FeatureTogglesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getBackendSrv).mockReturnValue({ get: mockGet, put: mockPut } as never);
    jest.mocked(getAppEvents).mockReturnValue({ publish: mockPublish } as never);
    mockGet.mockResolvedValue([
      {
        name: 'alphaFlag',
        description: 'An alpha toggle',
        stage: 'experimental',
        requiresDevMode: false,
        requiresRestart: false,
        enabled: false,
      },
      {
        name: 'betaFlag',
        description: 'A beta toggle',
        stage: 'preview',
        requiresDevMode: true,
        requiresRestart: true,
        enabled: true,
      },
    ]);
    mockPut.mockResolvedValue({ name: 'alphaFlag', enabled: true });
  });

  it('loads and renders toggles', async () => {
    jest.spyOn(contextSrv, 'hasPermission').mockImplementation((action: string) => {
      return action === 'featuremgmt.write';
    });

    renderPage();

    expect(await screen.findByText('alphaFlag')).toBeInTheDocument();
    expect(screen.getByText('betaFlag')).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith('/api/feature-toggles');
  });

  it('filters toggles by search text', async () => {
    jest.spyOn(contextSrv, 'hasPermission').mockReturnValue(true);
    renderPage();

    await screen.findByText('alphaFlag');
    await userEvent.type(screen.getByLabelText('Search feature toggles'), 'beta');

    expect(screen.queryByText('alphaFlag')).not.toBeInTheDocument();
    expect(screen.getByText('betaFlag')).toBeInTheDocument();
  });

  it('updates a toggle when user has write permission', async () => {
    jest.spyOn(contextSrv, 'hasPermission').mockImplementation((action: string) => {
      return action === 'featuremgmt.write';
    });

    renderPage();
    await screen.findByText('alphaFlag');

    const alphaSwitch = screen.getByRole('switch', { name: 'Toggle alphaFlag' });
    await userEvent.click(alphaSwitch);

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/feature-toggles/alphaFlag', { enabled: true });
    });

    await waitFor(() => {
      expect(alphaSwitch).toBeChecked();
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AppEvents.alertSuccess.name,
        payload: ['Enabled alphaFlag'],
      })
    );
  });

  it('reconciles optimistic state with the server response', async () => {
    jest.spyOn(contextSrv, 'hasPermission').mockReturnValue(true);
    mockPut.mockResolvedValue({ name: 'alphaFlag', enabled: false });

    renderPage();
    await screen.findByText('alphaFlag');

    const alphaSwitch = screen.getByRole('switch', { name: 'Toggle alphaFlag' });
    await userEvent.click(alphaSwitch);

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/feature-toggles/alphaFlag', { enabled: true });
    });

    await waitFor(() => {
      expect(alphaSwitch).not.toBeChecked();
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AppEvents.alertSuccess.name,
        payload: ['Disabled alphaFlag'],
      })
    );
  });

  it('shows read-only state without write permission', async () => {
    jest.spyOn(contextSrv, 'hasPermission').mockReturnValue(false);

    renderPage();
    await screen.findByText('alphaFlag');

    expect(screen.getByText('Read only')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Toggle alphaFlag' })).toBeDisabled();
  });
});
