import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import type { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, FilterInput, LoadingPlaceholder, ScrollContainer, Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface ObjectReference {
  kind?: string;
  name?: string;
  fieldPath?: string;
}

interface ToggleStatus {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  writeable: boolean;
  source?: ObjectReference;
  warning?: string;
}

interface ResolvedToggleState {
  allowEditing?: boolean;
  restartRequired?: boolean;
  enabled?: Record<string, boolean>;
  toggles?: ToggleStatus[];
}

const EMPTY_TOGGLES: ToggleStatus[] = [];

export default function FeatureFlagsPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const { loading, error, value } = useAsync(() => getBackendSrv().get<ResolvedToggleState>('/api/featuremgmt'), []);

  const toggles = value?.toggles ?? EMPTY_TOGGLES;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredToggles = useMemo(() => {
    if (!normalizedQuery) {
      return toggles;
    }

    return toggles.filter((toggle) => {
      return [toggle.name, toggle.description, toggle.stage, toggle.source?.name, toggle.warning]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery));
    });
  }, [normalizedQuery, toggles]);

  const enabledCount = toggles.filter((toggle) => toggle.enabled).length;
  const restartCount = toggles.filter((toggle) => toggle.source?.fieldPath).length;

  return (
    <Page navId="labs-feature-flags">
      <Page.Contents>
        <Stack direction="column" gap={3}>
          <Alert
            severity="info"
            title={t('labs.feature-flags.read-only-title', 'Feature flags are managed by configuration')}
          >
            <Trans i18nKey="labs.feature-flags.read-only-description">
              This dashboard shows the effective feature flag state for this Grafana instance. Feature flags are
              currently configured outside the UI and may require a restart when changed.
            </Trans>
          </Alert>

          <div className={styles.statsGrid}>
            <StatCard label={t('labs.feature-flags.total-flags', 'Total flags')} value={toggles.length} />
            <StatCard label={t('labs.feature-flags.enabled-flags', 'Enabled flags')} value={enabledCount} />
            <StatCard label={t('labs.feature-flags.configured-flags', 'Configured flags')} value={restartCount} />
          </div>

          <div className="page-action-bar">
            <FilterInput
              value={query}
              onChange={setQuery}
              placeholder={t('labs.feature-flags.filter-placeholder', 'Filter by name, stage, source, or description')}
            />
            <div className="page-action-bar__spacer" />
            <Text color="secondary">
              {t('labs.feature-flags.result-count', 'Showing {{count}} of {{total}} flags', {
                count: filteredToggles.length,
                total: toggles.length,
              })}
            </Text>
          </div>

          {loading && <LoadingPlaceholder text={t('labs.feature-flags.loading', 'Loading feature flags...')} />}
          {error && (
            <Alert severity="error" title={t('labs.feature-flags.error-title', 'Failed to load feature flags')}>
              {error.message}
            </Alert>
          )}
          {!loading && !error && (
            <ScrollContainer overflowY="visible" overflowX="auto" width="100%">
              <table className="filter-table filter-table--hover" data-testid="feature-flags-table">
                <thead>
                  <tr>
                    <th>
                      <Trans i18nKey="labs.feature-flags.name">Name</Trans>
                    </th>
                    <th>
                      <Trans i18nKey="labs.feature-flags.state">State</Trans>
                    </th>
                    <th>
                      <Trans i18nKey="labs.feature-flags.stage">Stage</Trans>
                    </th>
                    <th>
                      <Trans i18nKey="labs.feature-flags.source">Source</Trans>
                    </th>
                    <th>
                      <Trans i18nKey="labs.feature-flags.description">Description</Trans>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredToggles.map((toggle) => (
                    <tr key={toggle.name}>
                      <td>
                        <Text weight="medium">{toggle.name}</Text>
                        {toggle.warning && <Text color="warning">{toggle.warning}</Text>}
                      </td>
                      <td>
                        <Badge
                          color={toggle.enabled ? 'green' : 'darkgrey'}
                          text={
                            toggle.enabled
                              ? t('labs.feature-flags.enabled', 'Enabled')
                              : t('labs.feature-flags.disabled', 'Disabled')
                          }
                        />
                      </td>
                      <td>{toggle.stage || t('labs.feature-flags.unknown-stage', 'unknown')}</td>
                      <td>{formatSource(toggle.source)}</td>
                      <td>{toggle.description || <Text color="secondary">-</Text>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollContainer>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.statCard}>
      <Text color="secondary">{label}</Text>
      <Text element="div" variant="h2">
        {value}
      </Text>
    </div>
  );
}

function formatSource(source?: ObjectReference) {
  if (!source) {
    return t('labs.feature-flags.source-default', 'Default');
  }

  if (source.fieldPath) {
    return source.fieldPath;
  }

  return source.name ?? t('labs.feature-flags.source-default', 'Default');
}

const getStyles = (theme: GrafanaTheme2) => ({
  statsGrid: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  }),
  statCard: css({
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
  }),
});
