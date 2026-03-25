import { render, screen } from '@testing-library/react';

import { config } from '@grafana/runtime';

import { HomePageBanner } from './HomePageBanner';

describe('HomePageBanner', () => {
  const originalToggles = { ...config.featureToggles };

  afterEach(() => {
    config.featureToggles = { ...originalToggles };
  });

  it('renders banner when homePageBanner feature toggle is enabled', () => {
    config.featureToggles.homePageBanner = true;

    render(<HomePageBanner />);

    expect(screen.getByText('Welcome to Grafana!')).toBeInTheDocument();
    expect(screen.getByText(/Explore dashboards/)).toBeInTheDocument();
  });

  it('does not render when homePageBanner feature toggle is disabled', () => {
    config.featureToggles.homePageBanner = false;

    const { container } = render(<HomePageBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when homePageBanner feature toggle is undefined', () => {
    delete config.featureToggles.homePageBanner;

    const { container } = render(<HomePageBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders documentation link', () => {
    config.featureToggles.homePageBanner = true;

    render(<HomePageBanner />);

    const link = screen.getByText('documentation');
    expect(link).toHaveAttribute('href', 'https://grafana.com/docs/');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
