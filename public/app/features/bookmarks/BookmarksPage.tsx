import { css } from '@emotion/css';
import { useEffect, useMemo, useState } from 'react';

import { type GrafanaTheme2, type NavModelItem } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { EmptyState, useStyles2 } from '@grafana/ui';
import { usePinnedItems } from 'app/core/components/AppChrome/MegaMenu/hooks';
import { NavLandingPageCard } from 'app/core/components/NavLandingPage/NavLandingPageCard';
import { Page } from 'app/core/components/Page/Page';
import { useSelector } from 'app/types/store';

import { BookmarksPageToolbar } from './BookmarksPageToolbar';
import {
  ALL_CATEGORIES,
  bookmarkMatchesCategory,
  bookmarkMatchesQuery,
  buildBookmarkList,
  sortBookmarksBySectionThenTitle,
} from './utils';

const sectionLabelCollator = new Intl.Collator(undefined, { sensitivity: 'base' });

export function BookmarksPage() {
  const styles = useStyles2(getStyles);
  const pinnedItems = usePinnedItems();
  const navTree = useSelector((state) => state.navBarTree);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  const bookmarks = useMemo(
    () => buildBookmarkList(navTree, pinnedItems).sort(sortBookmarksBySectionThenTitle),
    [navTree, pinnedItems]
  );

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string }> = [];
    for (const { section } of bookmarks) {
      const value = section.id ?? section.url ?? '';
      if (!value || seen.has(value)) {
        continue;
      }
      seen.add(value);
      options.push({ value, label: section.text });
    }
    return options.sort((a, b) => sectionLabelCollator.compare(a.label, b.label));
  }, [bookmarks]);

  useEffect(() => {
    if (selectedCategory === ALL_CATEGORIES) {
      return;
    }
    const isValid = categoryOptions.some((o) => o.value === selectedCategory);
    if (!isValid) {
      setSelectedCategory(ALL_CATEGORIES);
    }
  }, [categoryOptions, selectedCategory]);

  const hasBookmarks = bookmarks.length > 0;

  const visibleBookmarks = useMemo(() => {
    if (!hasBookmarks) {
      return [];
    }
    return bookmarks.filter(({ item, section }) => {
      if (!bookmarkMatchesCategory(section, selectedCategory)) {
        return false;
      }
      return bookmarkMatchesQuery(item, section, search);
    });
  }, [bookmarks, hasBookmarks, search, selectedCategory]);

  return (
    <Page navId="bookmarks">
      <Page.Contents>
        {!hasBookmarks ? (
          <EmptyState
            variant="call-to-action"
            message={t('bookmarks-page.empty.message', 'It looks like you haven’t created any bookmarks yet')}
          >
            <Trans i18nKey="bookmarks-page.empty.tip">
              Hover over any item in the nav menu and click on the bookmark icon to add it here.
            </Trans>
          </EmptyState>
        ) : (
          <div className={styles.layout}>
            <BookmarksPageToolbar
              search={search}
              onSearchChange={setSearch}
              categoryOptions={categoryOptions}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              showCategories
            />
            {visibleBookmarks.length === 0 ? (
              <EmptyState
                variant="not-found"
                message={t(
                  'bookmarks-page.empty-filter.message',
                  'No bookmarks match your search or filter. Try a different search or category.'
                )}
              />
            ) : (
              <BookmarkSections bookmarks={visibleBookmarks} />
            )}
          </div>
        )}
      </Page.Contents>
    </Page>
  );
}

function BookmarkSections({ bookmarks }: { bookmarks: Array<{ item: NavModelItem; section: NavModelItem }> }) {
  const styles = useStyles2(getStyles);
  const groups = useMemo(() => {
    const map = new Map<string, { section: NavModelItem; items: NavModelItem[] }>();
    for (const { item, section } of bookmarks) {
      const key = section.id ?? section.url ?? section.text;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(key, { section, items: [item] });
      }
    }
    return [...map.values()].sort((a, b) => sectionLabelCollator.compare(a.section.text, b.section.text));
  }, [bookmarks]);

  return (
    <div className={styles.sections}>
      {groups.map(({ section, items }) => (
        <section key={section.id ?? section.url} className={styles.section} aria-labelledby={sectionHeadingId(section)}>
          <h2 className={styles.sectionHeading} id={sectionHeadingId(section)}>
            {section.text}
          </h2>
          <div className={styles.grid} role="list">
            {items.map((item) => (
              <div className={styles.listItem} key={item.id || item.url} role="listitem">
                <NavLandingPageCard description={item.subTitle} text={item.text} url={item.url ?? ''} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function sectionHeadingId(section: NavModelItem): string {
  const key = (section.id ?? section.url ?? 'section').replace(/[^a-zA-Z0-9_-]/g, '-');
  return `bookmarks-section-${key}`;
}

const getStyles = (theme: GrafanaTheme2) => ({
  layout: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  sections: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  }),
  section: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  }),
  sectionHeading: css({
    margin: 0,
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: theme.typography.h5.lineHeight,
    color: theme.colors.text.primary,
  }),
  grid: css({
    display: 'grid',
    gap: theme.spacing(3),
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gridAutoRows: '138px',
    padding: theme.spacing(2, 0, 0),
  }),
  listItem: css({
    minWidth: 0,
  }),
});

export default BookmarksPage;
