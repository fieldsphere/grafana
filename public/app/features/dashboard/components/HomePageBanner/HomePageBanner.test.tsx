import { render, screen } from '@testing-library/react';
import { TestProvider } from 'test/helpers/TestProvider';
import { getGrafanaContextMock } from 'test/mocks/getGrafanaContextMock';

import { HomePageBanner } from './HomePageBanner';

describe('HomePageBanner', () => {
  it('renders home banner messaging', () => {
    render(
      <TestProvider grafanaContext={getGrafanaContextMock()}>
        <HomePageBanner />
      </TestProvider>
    );

    expect(screen.getByText('Welcome home')).toBeInTheDocument();
    expect(
      screen.getByText('Use this home dashboard to discover, create, and organize your dashboards.')
    ).toBeInTheDocument();
  });
});
