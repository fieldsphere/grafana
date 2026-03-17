import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { NavModelItem } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import * as preferencesApi from '@grafana/api-clients/rtkq/legacy/preferences';
import { configureStore } from 'app/store/configureStore';

import * as hooks from './hooks';
import { MegaMenu } from './MegaMenu';

jest.mock('@grafana/api-clients/rtkq/legacy/preferences', () => {
  const mockPatchPreferences = jest.fn();
  const mockUpdateQueryData = jest.fn(() => ({ type: 'preferences/updateQueryData' }));

  return {
    usePatchUserPreferencesMutation: () => [mockPatchPreferences],
    generatedAPI: {
      util: {
        updateQueryData: mockUpdateQueryData,
      },
    },
    __mockPatchPreferences: mockPatchPreferences,
    __mockUpdateQueryData: mockUpdateQueryData,
  };
});

jest.mock('./hooks', () => ({
  usePinnedItems: jest.fn(() => [] as string[]),
}));

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
  const mockPatchPreferences = (preferencesApi as typeof preferencesApi & { __mockPatchPreferences: jest.Mock })
    .__mockPatchPreferences;
  const mockUpdateQueryData = (preferencesApi as typeof preferencesApi & { __mockUpdateQueryData: jest.Mock })
    .__mockUpdateQueryData;
  const mockUsePinnedItems = hooks.usePinnedItems as jest.Mock;

  beforeEach(() => {
    mockUsePinnedItems.mockReturnValue([]);
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
    mockPatchPreferences.mockResolvedValue({ data: { message: 'ok' } });

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
