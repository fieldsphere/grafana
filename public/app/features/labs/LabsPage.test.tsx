import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/test-utils';

import { contextSrv } from 'app/core/services/context_srv';

import LabsPage, { type LabsResolvedState } from './LabsPage';

const mockGet = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({
    get: mockGet,
    put: mockPut,
    delete: mockDelete,
  }),
}));

const sampleState: LabsResolvedState = {
  allowEditing: true,
  restartRequired: false,
  enabled: { myFrontendFlag: true },
  toggles: [
    {
      name: 'myFrontendFlag',
      description: 'Test flag',
      stage: 'preview',
      enabled: true,
      writeable: true,
    },
  ],
};

describe('LabsPage', () => {
  let wasGrafanaAdmin: boolean;

  beforeEach(() => {
    wasGrafanaAdmin = contextSrv.isGrafanaAdmin;
    contextSrv.isGrafanaAdmin = true;
    mockGet.mockResolvedValue(sampleState);
    mockPut.mockResolvedValue(sampleState);
    mockDelete.mockResolvedValue(sampleState);
  });

  afterEach(() => {
    contextSrv.isGrafanaAdmin = wasGrafanaAdmin;
    mockGet.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it('shows access denied when user is not a Grafana admin', async () => {
    contextSrv.isGrafanaAdmin = false;

    render(<LabsPage />);

    expect(await screen.findByText(/Access denied/i)).toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('loads toggles for Grafana admins', async () => {
    render(<LabsPage />);

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/api/admin/feature-toggles/labs'));
    expect(await screen.findByText('myFrontendFlag')).toBeInTheDocument();
  });
});
