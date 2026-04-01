import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';

import {
  generatedAPI as userPreferencesApi,
  useGetUserPreferencesQuery,
  usePatchUserPreferencesMutation,
} from '@grafana/api-clients/rtkq/legacy/preferences';
import { NavModelItem } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { contextSrv } from 'app/core/services/context_srv';
import { configureStore } from 'app/store/configureStore';

import { MegaMenu } from './MegaMenu';

jest.mock('@grafana/api-clients/rtkq/legacy/preferences', () => ({
  ...jest.requireActual('@grafana/api-clients/rtkq/legacy/preferences'),
  useGetUserPreferencesQuery: jest.fn(),
  usePatchUserPreferencesMutation: jest.fn(),
}));

const setup = () => {
  const navBarTree: NavModelItem[] = [
    {
      text: 'Bookmarks',
      id: 'bookmarks',
      url: '/bookmarks',
      children: [],
    },
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
  ];

  const store = configureStore({ navBarTree });
  return render(<MegaMenu onClose={() => {}} />, { store });
};

describe('MegaMenu', () => {
  const useGetUserPreferencesQueryMock = useGetUserPreferencesQuery as jest.Mock;
  const usePatchUserPreferencesMutationMock = usePatchUserPreferencesMutation as jest.Mock;
  const originalIsSignedIn = contextSrv.isSignedIn;
  const originalUserIsSignedIn = contextSrv.user.isSignedIn;
  const originalAuthenticatedBy = contextSrv.user.authenticatedBy;

  beforeEach(() => {
    contextSrv.isSignedIn = originalIsSignedIn;
    contextSrv.user.isSignedIn = originalUserIsSignedIn;
    contextSrv.user.authenticatedBy = originalAuthenticatedBy;
    useGetUserPreferencesQueryMock.mockReturnValue({ data: { navbar: { bookmarkUrls: [] } } });
    usePatchUserPreferencesMutationMock.mockReturnValue([jest.fn().mockResolvedValue({ data: { message: 'ok' } })]);
  });

  afterEach(() => {
    contextSrv.isSignedIn = originalIsSignedIn;
    contextSrv.user.isSignedIn = originalUserIsSignedIn;
    contextSrv.user.authenticatedBy = originalAuthenticatedBy;
    jest.restoreAllMocks();
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

  it('updates user preferences cache after successful pin', async () => {
    contextSrv.isSignedIn = true;
    contextSrv.user.isSignedIn = true;
    contextSrv.user.authenticatedBy = 'apikey';
    const patchPreferences = jest.fn().mockResolvedValue({ data: { message: 'ok' } });
    usePatchUserPreferencesMutationMock.mockReturnValue([patchPreferences]);
    const updateQueryDataSpy = jest.spyOn(userPreferencesApi.util, 'updateQueryData');

    setup();
    await userEvent.click(await screen.findByLabelText('Add Section name to Bookmarks'));

    expect(patchPreferences).toHaveBeenCalledWith({
      patchPrefsCmd: {
        navbar: {
          bookmarkUrls: ['/section'],
        },
      },
    });
    expect(updateQueryDataSpy).toHaveBeenCalledWith('getUserPreferences', undefined, expect.any(Function));
  });

  it('does not update user preferences cache when preference patch fails', async () => {
    contextSrv.isSignedIn = true;
    contextSrv.user.isSignedIn = true;
    contextSrv.user.authenticatedBy = 'apikey';
    const patchPreferences = jest.fn().mockResolvedValue({ error: { status: 500 } });
    usePatchUserPreferencesMutationMock.mockReturnValue([patchPreferences]);
    const updateQueryDataSpy = jest.spyOn(userPreferencesApi.util, 'updateQueryData');

    setup();
    await userEvent.click(await screen.findByLabelText('Add Section name to Bookmarks'));

    expect(patchPreferences).toHaveBeenCalled();
    expect(updateQueryDataSpy).not.toHaveBeenCalled();
  });
});
