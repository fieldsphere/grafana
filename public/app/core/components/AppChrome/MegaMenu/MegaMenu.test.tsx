import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import { NavModelItem } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { generatedAPI as preferencesUserAPI } from '@grafana/api-clients/rtkq/legacy/preferences';
import { ContextSrv, setContextSrv } from 'app/core/services/context_srv';
import { configureStore } from 'app/store/configureStore';

import { MegaMenu } from './MegaMenu';

const mockPatchUserPreferences = jest.fn();
const mockGetUserPreferencesQuery = jest.fn();

jest.mock('@grafana/api-clients/rtkq/legacy/preferences', () => {
  const actual = jest.requireActual('@grafana/api-clients/rtkq/legacy/preferences');
  return {
    ...actual,
    useGetUserPreferencesQuery: (...args: unknown[]) => mockGetUserPreferencesQuery(...args),
    usePatchUserPreferencesMutation: () => [mockPatchUserPreferences],
  };
});

beforeEach(() => {
  const contextSrv = new ContextSrv();
  contextSrv.user.isSignedIn = true;
  contextSrv.isSignedIn = true;
  contextSrv.user.authenticatedBy = 'apikey';
  setContextSrv(contextSrv);

  mockPatchUserPreferences.mockReset();
  mockPatchUserPreferences.mockResolvedValue({ data: { message: 'ok' } });
  mockGetUserPreferencesQuery.mockReset();
  mockGetUserPreferencesQuery.mockReturnValue({
    data: {
      navbar: { bookmarkUrls: [] },
    },
  });
});

afterEach(() => {
  window.localStorage.clear();
});

const setup = () => {
  const navBarTree: NavModelItem[] = [
    {
      text: 'Section name',
      id: 'section',
      url: '/section',
      children: [
        {
          text: 'Child1',
          id: 'child1',
          url: '/section/child1',
          children: [{ text: 'Grandchild1', id: 'grandchild1', url: '/section/child1/grandchild1' }],
        },
        { text: 'Child2', id: 'child2', url: '/section/child2' },
      ],
    },
    {
      text: 'Profile',
      id: 'profile',
      url: 'profile',
    },
    {
      text: 'Bookmarks',
      id: 'bookmarks',
      url: '/bookmarks',
    },
  ];

  const store = configureStore({ navBarTree });
  const rendered = render(<MegaMenu onClose={() => {}} />, { store });
  return { ...rendered, store };
};

describe('MegaMenu', () => {
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

  it('updates bookmarks immediately after successful pin', async () => {
    const updateQueryDataSpy = jest.spyOn(preferencesUserAPI.util, 'updateQueryData');

    setup();

    const pinButton = await screen.findByLabelText('Add Section name to Bookmarks');
    fireEvent.click(pinButton);

    await waitFor(() => {
      expect(mockPatchUserPreferences).toHaveBeenCalledWith({
        patchPrefsCmd: {
          navbar: { bookmarkUrls: ['/section'] },
        },
      });
      expect(updateQueryDataSpy).toHaveBeenCalledWith('getUserPreferences', undefined, expect.any(Function));
    });

    const recipe = updateQueryDataSpy.mock.calls[0][2] as (draft: { navbar?: { bookmarkUrls?: string[] } }) => void;
    const draftWithNavbar = { navbar: { bookmarkUrls: [] as string[] } };
    recipe(draftWithNavbar);
    expect(draftWithNavbar.navbar.bookmarkUrls).toEqual(['/section']);

    const draftWithoutNavbar: { navbar?: { bookmarkUrls?: string[] } } = {};
    recipe(draftWithoutNavbar);
    expect(draftWithoutNavbar.navbar?.bookmarkUrls).toEqual(['/section']);

    updateQueryDataSpy.mockRestore();
  });

  it('does not update bookmarks when pin request fails', async () => {
    const updateQueryDataSpy = jest.spyOn(preferencesUserAPI.util, 'updateQueryData');
    mockPatchUserPreferences.mockResolvedValue({ error: { status: 500, data: { message: 'failed' } } });

    setup();

    const pinButton = await screen.findByLabelText('Add Section name to Bookmarks');
    fireEvent.click(pinButton);

    await waitFor(() => {
      expect(mockPatchUserPreferences).toHaveBeenCalledWith({
        patchPrefsCmd: {
          navbar: { bookmarkUrls: ['/section'] },
        },
      });
    });

    expect(updateQueryDataSpy).not.toHaveBeenCalled();
    updateQueryDataSpy.mockRestore();
  });
});
