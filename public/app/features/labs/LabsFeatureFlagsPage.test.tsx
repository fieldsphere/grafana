import { fireEvent, render, screen } from '@testing-library/react';

const getMock = jest.fn();

jest.mock('@grafana/runtime', () => ({
  getBackendSrv: () => ({
    get: getMock,
  }),
}));

jest.mock('app/core/components/Page/Page', () => {
  const Page = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  Page.Contents = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  return { Page };
});

import LabsFeatureFlagsPage, { LabsFeatureFlagsTable } from './LabsFeatureFlagsPage';

describe('LabsFeatureFlagsPage', () => {
  afterEach(() => {
    getMock.mockReset();
  });

  it('loads and renders feature flags', async () => {
    let resolveRequest!: (value: unknown) => void;
    getMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    render(<LabsFeatureFlagsPage />);

    expect(screen.getByText('Loading feature flags...')).toBeInTheDocument();

    resolveRequest({
      toggles: [{ name: 'alphaFeature', stage: 'experimental', enabled: false, description: 'Alpha feature' }],
    });

    expect(await screen.findByText('alphaFeature')).toBeInTheDocument();
  });

  it('filters feature flags by query', () => {
    render(
      <LabsFeatureFlagsTable
        toggles={[
          { name: 'alphaFeature', stage: 'experimental', enabled: false, description: 'Alpha feature' },
          { name: 'betaFeature', stage: 'preview', enabled: true, description: 'Beta feature' },
        ]}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Search by name/i), { target: { value: 'beta' } });

    expect(screen.queryByText('alphaFeature')).not.toBeInTheDocument();
    expect(screen.getByText('betaFeature')).toBeInTheDocument();
  });
});
