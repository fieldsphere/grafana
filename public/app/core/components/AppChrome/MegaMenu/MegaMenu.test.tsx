import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/test-utils';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { NavModelItem } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { ContextSrv, setContextSrv } from 'app/core/services/context_srv';
import { configureStore } from 'app/store/configureStore';

import { MegaMenu } from './MegaMenu';

const server = setupServer();

beforeAll(() => server.listen());
beforeEach(() => {
  const contextSrv = new ContextSrv();
  contextSrv.user.isSignedIn = true;
  contextSrv.isSignedIn = true;
  setContextSrv(contextSrv);
});
afterEach(() => {
  server.resetHandlers();
  window.localStorage.clear();
});
afterAll(() => server.close());

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
    server.use(
      http.get('/api/user/preferences', () => {
        return HttpResponse.json({
          navbar: { bookmarkUrls: [] },
          queryHistory: {},
          theme: '',
        });
      }),
      http.patch('/api/user/preferences', async ({ request }) => {
        const body = (await request.json()) as { navbar?: { bookmarkUrls?: string[] } };
        expect(body?.navbar?.bookmarkUrls).toEqual(['/section']);
        return HttpResponse.json({});
      })
    );

    setup();

    const sectionRow = (await screen.findByRole('link', { name: 'Section name' })).closest('div');
    expect(sectionRow).not.toBeNull();
    await userEvent.hover(sectionRow!);
    await userEvent.click(await screen.findByLabelText('Add Section name to Bookmarks'));

    const bookmarksRow = (await screen.findByRole('link', { name: 'Bookmarks' })).closest('li');
    expect(bookmarksRow).not.toBeNull();
    const expandBookmarksButton = await within(bookmarksRow!).findByRole('button', { name: 'Expand section: Bookmarks' });
    await userEvent.click(expandBookmarksButton);

    expect(await within(bookmarksRow!).findByRole('link', { name: 'Section name' })).toBeInTheDocument();
  });

  it('does not update bookmarks when pin request fails', async () => {
    server.use(
      http.get('/api/user/preferences', () => {
        return HttpResponse.json({
          navbar: { bookmarkUrls: [] },
          queryHistory: {},
          theme: '',
        });
      }),
      http.patch('/api/user/preferences', () => {
        return HttpResponse.json({ message: 'failed' }, { status: 500 });
      })
    );

    setup();

    const sectionRow = (await screen.findByRole('link', { name: 'Section name' })).closest('div');
    expect(sectionRow).not.toBeNull();
    await userEvent.hover(sectionRow!);
    await userEvent.click(await screen.findByLabelText('Add Section name to Bookmarks'));

    const bookmarksRow = (await screen.findByRole('link', { name: 'Bookmarks' })).closest('li');
    expect(bookmarksRow).not.toBeNull();
    expect(within(bookmarksRow!).queryByRole('button', { name: 'Expand section: Bookmarks' })).not.toBeInTheDocument();
    expect(within(bookmarksRow!).queryByRole('link', { name: 'Section name' })).not.toBeInTheDocument();
  });
});
