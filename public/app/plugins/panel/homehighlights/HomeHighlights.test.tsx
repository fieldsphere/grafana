import { render, screen } from 'test/test-utils';

import { getPanelProps } from '../test-utils';

import { HomeHighlightsPanel } from './HomeHighlights';

describe('HomeHighlightsPanel', () => {
  it('renders the overview content and actions', async () => {
    render(<HomeHighlightsPanel {...getPanelProps({})} />);

    expect(screen.getByRole('heading', { name: /start from a clearer operating picture/i })).toBeInTheDocument();
    expect(screen.getByText(/follow key platform flows/i)).toBeInTheDocument();
    expect(screen.getByText(/24\/7/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /explore data/i })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: /review alerts/i })).toHaveAttribute('href', '/alerting/list');
    expect(screen.getByRole('link', { name: /learn the grafana fundamentals/i })).toHaveAttribute(
      'href',
      expect.stringContaining('https://grafana.com/docs/grafana/latest/fundamentals/')
    );
  });
});
