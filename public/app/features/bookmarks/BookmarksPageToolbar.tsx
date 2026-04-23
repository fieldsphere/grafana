import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { FilterInput, FilterPill, Stack, useStyles2 } from '@grafana/ui';

import { ALL_CATEGORIES } from './utils';

export interface BookmarksPageToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Distinct top-level section labels for pills (e.g. Starred, Dashboards). */
  categoryOptions: Array<{ value: string; label: string }>;
  /** `ALL_CATEGORIES` or a section id. */
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  /** If false, category pills are hidden (no resolved sections). */
  showCategories: boolean;
}

export function BookmarksPageToolbar({
  search,
  onSearchChange,
  categoryOptions,
  selectedCategory,
  onCategoryChange,
  showCategories,
}: BookmarksPageToolbarProps) {
  const styles = useStyles2(getStyles);
  const allLabel = t('bookmarks-page.toolbar.filter.category-all', 'All');

  return (
    <Stack direction="column" gap={1}>
      <div className={styles.filterRow}>
        <FilterInput
          escapeRegex={false}
          placeholder={t('bookmarks-page.toolbar.search.placeholder', 'Search bookmarks')}
          value={search}
          onChange={onSearchChange}
          aria-label={t('bookmarks-page.toolbar.search.aria-label', 'Search bookmarks')}
        />
      </div>
      {showCategories && categoryOptions.length > 0 && (
        <div
          className={styles.pills}
          role="group"
          aria-label={t('bookmarks-page.toolbar.filter.category-aria', 'Filter by app section')}
        >
          <FilterPill
            key="all"
            label={allLabel}
            selected={selectedCategory === ALL_CATEGORIES}
            onClick={() => onCategoryChange(ALL_CATEGORIES)}
          />
          {categoryOptions.map((opt) => (
            <FilterPill
              key={opt.value}
              label={opt.label}
              selected={selectedCategory === opt.value}
              onClick={() => onCategoryChange(opt.value)}
            />
          ))}
        </div>
      )}
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  filterRow: css({
    maxWidth: '480px',
  }),
  pills: css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
});
