import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import * as preferencesApi from '@grafana/api-clients/rtkq/legacy/preferences';
import { NavModelItem } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { contextSrv } from 'app/core/services/context_srv';
import { configureStore } from 'app/store/configureStore';

import * as hooks from './hooks';
import { MegaMenu } from './MegaMenu';

jest.mock('@grafana/api-clients/rtkq/legacy/preferences', () => {
  const actual = jest.requireActual('@grafana/api-clients/rtkq/legacy/preferences');
  return {
    ...actual,
    usePatchUserPreferencesMutation: jest.fn(),
    generatedAPI: {
      ...actual.generatedAPI,
      util: {
        ...actual.generatedAPI.util,
        updateQueryData: jest.fn(),
      },
    },
  };
});

const setup = () => {
  const navBarTree: NavModelItem[] = [
    {
      text: 'Section name',
      id: 'section',
      url: 'section',
      children: [
        {
          text: 'Child1',
          id: 'child1',
          url: 'section/child1',
          children: [{ text: 'Grandchild1', id: 'grandchild1', url: 'section/child1/grandchild1' }],
        },
        { text: 'Child2', id: 'child2', url: 'section/child2' },
      ],
    },
    {
      text: 'Profile',
      id: 'profile',
      url: 'profile',
    },
  ];

  const store = configureStore({ navBarTree });
  return render(<MegaMenu onClose={() => {}} />, { store });
};

describe('MegaMenu', () => {
  let mockPatchPreferences: jest.Mock;
  let mockUpdateQueryData: jest.Mock;

  beforeEach(() => {
    jest.spyOn(hooks, 'usePinnedItems').mockReturnValue([]);

    mockPatchPreferences = jest.fn().mockResolvedValue({ data: { message: 'ok' } });
    (preferencesApi.usePatchUserPreferencesMutation as jest.Mock).mockReturnValue([
      mockPatchPreferences,
      {} as ReturnType<typeof preferencesApi.usePatchUserPreferencesMutation>[1],
    ]);

    mockUpdateQueryData = preferencesApi.generatedAPI.util.updateQueryData as jest.Mock;
    mockUpdateQueryData.mockReturnValue({ type: 'preferences/updateQueryData' });
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });
  it('should render component', async () => {
    setup();

    expect(await screen.findByTestId(selectors.components.NavMenu.Menu)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Section name' })).toBeInTheDocument();
  });

  it('should render children', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Expand section: Section name' }));
    expect(await screen.findByRole('link', { name: 'Child1' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Child2' })).toBeInTheDocument();
  });

  it('should render grandchildren', async () => {
    setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Expand section: Section name' }));
    expect(await screen.findByRole('link', { name: 'Child1' })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'Expand section: Child1' }));
    expect(await screen.findByRole('link', { name: 'Grandchild1' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Child2' })).toBeInTheDocument();
  });

  it('should filter out profile', async () => {
    setup();

    expect(screen.queryByLabelText('Profile')).not.toBeInTheDocument();
  });

  it('updates pinned items query cache after pinning', async () => {
    contextSrv.isSignedIn = true;
    contextSrv.user.authenticatedBy = 'apikey';
    setup();

    await userEvent.click(await screen.findByLabelText('Add Section name to Bookmarks'));

    await waitFor(() => {
      expect(mockPatchPreferences).toHaveBeenCalledWith({
        patchPrefsCmd: {
          navbar: {
            bookmarkUrls: ['section'],
          },
        },
      });
      expect(mockUpdateQueryData).toHaveBeenCalledWith('getUserPreferences', undefined, expect.any(Function));
    });
  });
});
