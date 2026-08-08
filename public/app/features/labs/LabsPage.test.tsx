import { screen } from '@testing-library/react';

import { config } from '@grafana/runtime';
import { buildInitialState } from 'app/core/reducers/navModel';
import { render } from 'test/test-utils';

import { LabsPage } from './LabsPage';

describe('LabsPage', () => {
  const navIndexBase = buildInitialState();

  it('lists feature toggles from config sorted by name', () => {
    config.featureToggles = { zebraFlag: true, alphaFlag: false } as typeof config.featureToggles;

    render(<LabsPage />, {
      preloadedState: {
        navIndex: {
          ...navIndexBase,
          labs: {
            id: 'labs',
            text: 'Labs',
            url: '/labs',
            parentItem: navIndexBase.home,
          },
        },
      },
    });

    expect(screen.getByText('alphaFlag')).toBeInTheDocument();
    expect(screen.getByText('zebraFlag')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    // header + 2 data rows
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('alphaFlag');
    expect(rows[1]).toHaveTextContent('No');
    expect(rows[2]).toHaveTextContent('zebraFlag');
    expect(rows[2]).toHaveTextContent('Yes');
  });
});
