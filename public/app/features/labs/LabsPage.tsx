import { useEffect, useMemo, useState } from 'react';

import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Badge,
  CellProps,
  Column,
  FilterInput,
  InteractiveTable,
  LoadingPlaceholder,
  Stack,
  Switch,
  Text,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { FeatureToggleListItem, FeatureToggleListResponse } from './types';

type Cell<T extends keyof FeatureToggleListItem> = CellProps<FeatureToggleListItem, FeatureToggleListItem[T]>;

export default function LabsPage() {
  const [items, setItems] = useState<FeatureToggleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [enabledOnly, setEnabledOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBackendSrv()
      .get<FeatureToggleListResponse>('/api/feature-toggles')
      .then((res) => {
        if (!cancelled) {
          setItems(res.toggles);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : t('labs.load-error', 'Failed to load feature toggles');
          setLoadError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let rows = items;
    if (enabledOnly) {
      rows = rows.filter((r) => r.enabled);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          String(r.stage).toLowerCase().includes(q)
      );
    }
    return rows;
  }, [items, query, enabledOnly]);

  const columns: Array<Column<FeatureToggleListItem>> = useMemo(
    () => [
      {
        id: 'name',
        header: t('labs.table.column-name', 'Name'),
        cell: ({ cell: { value } }: Cell<'name'>) => (
          <Text element="span" variant="bodySmall">
            {value}
          </Text>
        ),
        sortType: 'string',
      },
      {
        id: 'enabled',
        header: t('labs.table.column-enabled', 'Enabled'),
        cell: ({ cell: { value } }: Cell<'enabled'>) => (
          <Badge
            color={value ? 'green' : 'darkgrey'}
            text={value ? t('labs.badge-on', 'On') : t('labs.badge-off', 'Off')}
          />
        ),
        sortType: 'basic',
      },
      {
        id: 'stage',
        header: t('labs.table.column-stage', 'Stage'),
        cell: ({ cell: { value } }: Cell<'stage'>) => value || t('labs.empty-value', '—'),
        sortType: 'string',
      },
      {
        id: 'description',
        header: t('labs.table.column-description', 'Description'),
        cell: ({ cell: { value } }: Cell<'description'>) => value || t('labs.empty-value', '—'),
        sortType: 'string',
      },
    ],
    []
  );

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Text element="p">
            <Trans i18nKey="labs.intro">
              Feature flags registered in this Grafana build and whether each is enabled for your current session.
            </Trans>
          </Text>

          <Stack gap={2} alignItems="center" wrap="wrap">
            <FilterInput
              placeholder={t('labs.filter-placeholder', 'Search by name, description, or stage')}
              value={query}
              width={40}
              onChange={(value) => setQuery(value)}
            />
            <Switch
              id="labs-enabled-only"
              label={t('labs.enabled-only', 'Enabled only')}
              value={enabledOnly}
              onChange={(e) => setEnabledOnly(e.currentTarget.checked)}
            />
          </Stack>

          {loading && <LoadingPlaceholder text={t('labs.loading', 'Loading feature toggles')} />}
          {loadError && (
            <Text color="error" element="p">
              {loadError}
            </Text>
          )}
          {!loading && !loadError && (
            <InteractiveTable columns={columns} data={filtered} getRowId={(row) => row.name} />
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}
