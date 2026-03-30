import { render, screen } from 'test/test-utils';

import { WelcomeBanner } from './Welcome';

describe('WelcomeBanner', () => {
  it('renders hero copy and key actions', async () => {
    render(<WelcomeBanner />);

    expect(
      await screen.findByRole('heading', { name: 'See issues sooner and ship with confidence' })
    ).toBeInTheDocument();
    expect(screen.getByText('Monitor metrics, logs, traces, and profiles in one place so your team can respond faster.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore dashboards' })).toHaveAttribute('href', '/dashboards');
    expect(screen.getByRole('link', { name: 'Connect data sources' })).toHaveAttribute(
      'href',
      '/connections/datasources'
    );
  });

  it('renders help links with tracking parameters', () => {
    render(<WelcomeBanner />);

    expect(screen.getByRole('heading', { name: 'Need help?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute(
      'href',
      'https://grafana.com/docs/grafana/latest?utm_source=grafana_gettingstarted'
    );
    expect(screen.getByRole('link', { name: 'Public Slack' })).toHaveAttribute(
      'href',
      'http://slack.grafana.com?utm_source=grafana_gettingstarted'
    );
  });
});
