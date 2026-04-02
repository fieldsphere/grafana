import { screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { NavModelItem } from '@grafana/data';

import { usePinnedItems } from 'app/core/components/AppChrome/MegaMenu/hooks';

import { BookmarksPage } from './BookmarksPage';

jest.mock('app/core/components/AppChrome/MegaMenu/hooks', () => ({
  usePinnedItems: jest.fn(),
}));

const mockedUsePinnedItems = jest.mocked(usePinnedItems);

describe('BookmarksPage', () => {
  const navBarTree: NavModelItem[] = [
    {
      id: 'dashboards',
      text: 'Dashboards',
      url: '/dashboards',
      children: [{ id: 'dashboards/browse', text: 'Browse dashboards', url: '/dashboards/browse' }],
    },
    {
      id: 'explore',
      text: 'Explore',
      url: '/explore',
      children: [{ id: 'explore/metrics', text: 'Metrics', url: '/explore/metrics' }],
    },
  ];

  beforeEach(() => {
    mockedUsePinnedItems.mockReset();
  });

  it('renders all pinned items, even when they are from different sections', async () => {
    mockedUsePinnedItems.mockReturnValue(['/dashboards/browse', '/explore/metrics']);

    render(<BookmarksPage />, {
      preloadedState: {
        navBarTree,
        navIndex: {
          bookmarks: { id: 'bookmarks', text: 'Bookmarks', url: '/bookmarks' },
        },
      },
    });

    expect(await screen.findByRole('link', { name: 'Browse dashboards' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Metrics' })).toBeInTheDocument();
  });
});
