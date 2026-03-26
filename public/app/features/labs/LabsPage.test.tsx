import { http, HttpResponse } from 'msw';
import { ComponentProps } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

import { screen } from '@testing-library/react';
import server, { setupMockServer } from '@grafana/test-utils/server';
import { render } from 'test/test-utils';

import LabsPage from './LabsPage';

setupMockServer();

jest.mock('react-virtualized-auto-sizer', () => {
  return {
    __esModule: true,
    default(props: ComponentProps<typeof AutoSizer>) {
      return <div>{props.children({ width: 1000, height: 600, scaledWidth: 1000, scaledHeight: 600 })}</div>;
    },
  };
});

describe('LabsPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/labs/feature-toggles', () =>
        HttpResponse.json({
          toggles: [
            {
              name: 'alphaToggle',
              description: 'Alpha feature',
              stage: 'experimental',
              enabled: true,
            },
            {
              name: 'betaToggle',
              description: 'Beta feature',
              stage: 'preview',
              enabled: false,
            },
          ],
        })
      )
    );
  });

  it('renders feature toggle counts and filters rows by search term', async () => {
    const { user } = render(<LabsPage />);

    expect(await screen.findByRole('heading', { name: 'Labs feature flags' })).toBeInTheDocument();
    expect(await screen.findByText('2 total')).toBeInTheDocument();
    expect(screen.getByText('1 enabled')).toBeInTheDocument();
    expect(screen.getByText('1 disabled')).toBeInTheDocument();
    expect(screen.getByText('alphaToggle')).toBeInTheDocument();
    expect(screen.getByText('betaToggle')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search feature toggles'), 'alpha');

    expect(screen.getByText('1 total')).toBeInTheDocument();
    expect(screen.getByText('alphaToggle')).toBeInTheDocument();
    expect(screen.queryByText('betaToggle')).not.toBeInTheDocument();
  });
});
