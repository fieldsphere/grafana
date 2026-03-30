import { render, screen } from 'test/test-utils';

import { WelcomeBanner } from './Welcome';

describe('WelcomeBanner', () => {
  it('renders the hero message, actions, and help links', async () => {
    render(<WelcomeBanner />);

    expect(screen.getByRole('heading', { name: /welcome to grafana/i })).toBeInTheDocument();
    expect(screen.getByText(/bring telemetry, dashboards, and investigation workflows together/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /launch dashboards/i })).toHaveAttribute('href', '/dashboards');
    expect(screen.getByRole('link', { name: /connect data/i })).toHaveAttribute('href', '/datasources/new');
    expect(screen.getByRole('link', { name: /documentation/i })).toHaveAttribute(
      'href',
      'https://grafana.com/docs/grafana/latest?utm_source=grafana_home'
    );
  });

  it('renders the capability cards', () => {
    render(<WelcomeBanner />);

    expect(screen.getByText(/unify every signal/i)).toBeInTheDocument();
    expect(screen.getByText(/move from issue to root cause/i)).toBeInTheDocument();
    expect(screen.getByText(/scale with your team/i)).toBeInTheDocument();
  });
});
