import { useState } from 'react';

import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { type Column, EmptyState, FilterInput, InteractiveTable, Stack } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface FeatureFlagRow {
  name: string;
}

const compareFeatureFlags = new Intl.Collator('en', { sensitivity: 'base', numeric: true }).compare;

function getEnabledFeatureFlags(): FeatureFlagRow[] {
  return Object.entries(config.featureToggles)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([name]) => ({ name }))
    .sort((a, b) => compareFeatureFlags(a.name, b.name));
}

export function LabsPage() {
  const [query, setQuery] = useState('');
  const enabledFlags = getEnabledFeatureFlags();
  const filteredFlags = query
    ? enabledFlags.filter((flag) => flag.name.toLowerCase().includes(query.toLowerCase()))
    : enabledFlags;

  const columns: Array<Column<FeatureFlagRow>> = [
    {
      id: 'name',
      header: t('labs.feature-flags.columns.name', 'Feature flag'),
    },
  ];

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          {enabledFlags.length > 0 && (
            <FilterInput
              placeholder={t('labs.feature-flags.filter-placeholder', 'Search feature flags')}
              value={query}
              onChange={setQuery}
              escapeRegex={false}
            />
          )}

          {enabledFlags.length === 0 ? (
            <EmptyState
              variant="not-found"
              message={t('labs.feature-flags.empty.message', 'No feature flags are currently enabled')}
            >
              <Trans i18nKey="labs.feature-flags.empty.description">
                Feature flags enabled for this Grafana instance will appear here.
              </Trans>
            </EmptyState>
          ) : filteredFlags.length === 0 ? (
            <EmptyState
              variant="not-found"
              message={t('labs.feature-flags.filter-empty.message', 'No feature flags match your search')}
            />
          ) : (
            <InteractiveTable columns={columns} data={filteredFlags} getRowId={(row) => row.name} />
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

export default LabsPage;
