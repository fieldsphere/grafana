import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from 'test/test-utils';

import { getLocalStorageProvider } from '@grafana/runtime/internal';

import LabsPage from './LabsPage';

const getStorageKey = (flagName: string) => `grafana.openfeature.${flagName}`;

describe('LabsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    getLocalStorageProvider().clearFlags();
  });

  it('renders Labs feature flags from the generated catalog', () => {
    render(<LabsPage />);

    expect(screen.getByRole('heading', { name: 'Try new Grafana features' })).toBeInTheDocument();
    expect(screen.getByText('Analytics Framework')).toBeInTheDocument();
    expect(screen.getByText('Enables new analytics framework')).toBeInTheDocument();
  });

  it('filters Labs by search query and stage', async () => {
    const user = userEvent.setup();
    render(<LabsPage />);

    await user.type(screen.getByRole('textbox', { name: 'Search Labs' }), 'homepage');

    expect(screen.getByText('Grafana Unified Homepage')).toBeInTheDocument();
    expect(screen.queryByText('Analytics Framework')).not.toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: 'Search Labs' }));
    await user.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByText('Query Editor Next')).toBeInTheDocument();
    expect(screen.queryByText('Analytics Framework')).not.toBeInTheDocument();
  });

  it('opts into a Labs feature with an OpenFeature local override', async () => {
    const user = userEvent.setup();
    render(<LabsPage />);

    await user.click(screen.getByRole('switch', { name: 'Toggle Analytics Framework' }));

    await waitFor(() => {
      expect(window.localStorage.getItem(getStorageKey('analyticsFramework'))).toBe('true');
    });
    expect(screen.getByText('Custom choice')).toBeInTheDocument();
  });

  it('resets all Labs choices without clearing unrelated feature overrides', async () => {
    const user = userEvent.setup();
    getLocalStorageProvider().setFlags({ analyticsFramework: true, unrelatedFlag: true });

    render(<LabsPage />);

    await user.click(screen.getByRole('button', { name: 'Reset all Labs choices' }));

    await waitFor(() => {
      expect(window.localStorage.getItem(getStorageKey('analyticsFramework'))).toBeNull();
    });
    expect(window.localStorage.getItem(getStorageKey('unrelatedFlag'))).toBe('true');
  });
});
