import { type NavModelItem } from '@grafana/data';

import {
  ALL_CATEGORIES,
  bookmarkMatchesCategory,
  bookmarkMatchesQuery,
  buildBookmarkList,
  resolveBookmarkInNavTree,
  sortBookmarksBySectionThenTitle,
} from './utils';

const tree: NavModelItem[] = [
  {
    id: 'bookmarks',
    text: 'Bookmarks',
    url: '/bookmarks',
    children: [{ id: 'b1', text: 'Admin duplicate', url: '/admin' }],
  },
  {
    id: 'config',
    text: 'Administration',
    url: '/admin',
  },
  {
    id: 'home',
    text: 'Home',
    url: '/',
  },
];

describe('bookmarks utils', () => {
  it('resolveBookmarkInNavTree prefers a match outside the Bookmarks section', () => {
    const resolved = resolveBookmarkInNavTree(tree, '/admin');
    expect(resolved?.section.id).toBe('config');
    expect(resolved?.item.id).toBe('config');
  });

  it('resolveBookmarkInNavTree falls back to the Bookmarks section', () => {
    const onlyBookmarks: NavModelItem[] = [
      { id: 'bookmarks', text: 'Bookmarks', url: '/bookmarks', children: [{ id: 'x', text: 'X', url: '/only' }] },
    ];
    const resolved = resolveBookmarkInNavTree(onlyBookmarks, '/only');
    expect(resolved?.section.id).toBe('bookmarks');
  });

  it('buildBookmarkList preserves order and skips unknown URLs', () => {
    const list = buildBookmarkList(tree, ['/', '/nope', '/admin']);
    expect(list.map((b) => b.item.url)).toEqual(['/', '/admin']);
  });

  it('sortBookmarksBySectionThenTitle', () => {
    const a = { item: { text: 'B' } as NavModelItem, section: { id: 's1', text: 'S1' } as NavModelItem };
    const b = { item: { text: 'A' } as NavModelItem, section: { id: 's2', text: 'S2' } as NavModelItem };
    expect([b, a].sort(sortBookmarksBySectionThenTitle).map((x) => x.item.text)).toEqual(['B', 'A']);
  });

  it('bookmarkMatchesQuery', () => {
    const item = { text: 'My Dashboard' } as NavModelItem;
    const section = { text: 'Starred' } as NavModelItem;
    expect(bookmarkMatchesQuery(item, section, 'dash')).toBe(true);
    expect(bookmarkMatchesQuery(item, section, 'star')).toBe(true);
    expect(bookmarkMatchesQuery(item, section, 'nope')).toBe(false);
  });

  it('bookmarkMatchesCategory', () => {
    const section = { id: 'home', text: 'Home' } as NavModelItem;
    expect(bookmarkMatchesCategory(section, ALL_CATEGORIES)).toBe(true);
    expect(bookmarkMatchesCategory(section, 'home')).toBe(true);
    expect(bookmarkMatchesCategory(section, 'other')).toBe(false);
  });
});
