import { type NavModelItem } from '@grafana/data';
import { findByUrl } from 'app/core/components/AppChrome/MegaMenu/utils';

const bookmarkNameCollator = new Intl.Collator(undefined, { sensitivity: 'base' });

export const BOOKMARKS_SECTION_ID = 'bookmarks';

export interface BookmarkWithSection {
  item: NavModelItem;
  section: NavModelItem;
}

/**
 * Resolves a bookmark URL to a nav item and the top-level section it belongs to.
 * Matches outside the "Bookmarks" nav subsection first so pinned items that also
 * appear as bookmark shortcuts use the same metadata as the rest of the app nav.
 */
export function resolveBookmarkInNavTree(topLevel: NavModelItem[], url: string): BookmarkWithSection | null {
  for (const section of topLevel) {
    if (section.id === BOOKMARKS_SECTION_ID) {
      continue;
    }
    const item = findByUrl([section], url);
    if (item) {
      return { item, section };
    }
  }
  const bookmarks = topLevel.find((s) => s.id === BOOKMARKS_SECTION_ID);
  if (bookmarks) {
    const item = findByUrl([bookmarks], url);
    if (item) {
      return { item, section: bookmarks };
    }
  }
  return null;
}

export function buildBookmarkList(navTree: NavModelItem[], bookmarkUrls: string[]): BookmarkWithSection[] {
  return bookmarkUrls.reduce<BookmarkWithSection[]>((acc, url) => {
    const resolved = resolveBookmarkInNavTree(navTree, url);
    if (resolved) {
      acc.push(resolved);
    }
    return acc;
  }, []);
}

const normalizeSearch = (value: string) => value.trim().toLowerCase();

/**
 * True if the bookmark matches the search string on title, subtitle, or section label.
 */
export function bookmarkMatchesQuery(item: NavModelItem, section: NavModelItem, search: string): boolean {
  if (!search) {
    return true;
  }
  const q = normalizeSearch(search);
  const inText = normalizeSearch(item.text).includes(q);
  const inSub = item.subTitle ? normalizeSearch(item.subTitle).includes(q) : false;
  const inSection = normalizeSearch(section.text).includes(q);
  return inText || inSub || inSection;
}

export const ALL_CATEGORIES = '__all__';

/**
 * @param sectionId - `ALL_CATEGORIES` for no filter, otherwise `NavModelItem.id` (or url fallback) of the top-level section.
 */
export function bookmarkMatchesCategory(section: NavModelItem, sectionId: string): boolean {
  if (sectionId === ALL_CATEGORIES) {
    return true;
  }
  const id = section.id ?? section.url ?? '';
  return id === sectionId;
}

export function sortBookmarksBySectionThenTitle(a: BookmarkWithSection, b: BookmarkWithSection): number {
  const bySection = bookmarkNameCollator.compare(a.section.text, b.section.text);
  if (bySection !== 0) {
    return bySection;
  }
  return bookmarkNameCollator.compare(a.item.text, b.item.text);
}
