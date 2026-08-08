import { css } from '@emotion/css';
import { ClientProviderEvents } from '@openfeature/web-sdk';
import { useEffect, useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { getLocalStorageProvider } from '@grafana/runtime/internal';
import { Alert, Badge, Button, Card, Field, Input, Stack, Switch, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';

const compare = new Intl.Collator('en', { sensitivity: 'base', numeric: true }).compare;

type FlagValues = Record<string, unknown>;

export interface FeatureFlagRow {
  key: string;
  defaultEnabled: boolean;
  enabled: boolean;
  hasOverride: boolean;
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return Boolean(value);
}

function hasOwnValue(values: FlagValues, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(values, key);
}

export function getFeatureFlagRows(featureToggles: object, overrides: FlagValues): FeatureFlagRow[] {
  const enabledKeys = Object.entries(featureToggles)
    .filter(([, enabled]) => enabled === true)
    .map(([key]) => key);

  const keys = new Set([...enabledKeys, ...Object.keys(overrides)]);

  return [...keys]
    .map((key) => {
      const hasOverride = hasOwnValue(overrides, key);

      return {
        key,
        defaultEnabled: enabledKeys.includes(key),
        enabled: hasOverride ? normalizeBoolean(overrides[key]) : true,
        hasOverride,
      };
    })
    .sort((a, b) => compare(a.key, b.key));
}

export default function LabsPage() {
  const navModel = useNavModel('labs');
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const [overrides, setOverrides] = useState<FlagValues>(() => ({ ...getLocalStorageProvider().getFlags() }));

  useEffect(() => {
    const provider = getLocalStorageProvider();
    const loadOverrides = () => setOverrides({ ...provider.getFlags() });

    loadOverrides();
    provider.events.addHandler(ClientProviderEvents.ConfigurationChanged, loadOverrides);

    return () => {
      provider.events.removeHandler(ClientProviderEvents.ConfigurationChanged, loadOverrides);
    };
  }, []);

  const rows = useMemo(() => getFeatureFlagRows(config.featureToggles ?? {}, overrides), [overrides]);
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return rows;
    }

    return rows.filter((row) => row.key.toLowerCase().includes(normalizedQuery));
  }, [query, rows]);

  const setFlagOverride = (key: string, enabled: boolean) => {
    getLocalStorageProvider().setFlags({ [key]: enabled });
  };

  const resetFlagOverride = (key: string) => {
    getLocalStorageProvider().setFlags({ [key]: undefined });
  };

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <Stack direction="column" gap={3}>
          <div>
            <Text element="h1" variant="h1">
              <Trans i18nKey="labs.feature-flags.title">Feature flags</Trans>
            </Text>
            <Text color="secondary">
              <Trans i18nKey="labs.feature-flags.description">
                Review enabled feature flags and control local overrides for this browser.
              </Trans>
            </Text>
          </div>

          <Card noMargin className={styles.summaryCard}>
            <Stack direction="column" gap={2}>
              <Stack direction="row" gap={1} alignItems="center">
                <Badge color="blue" text={rows.length} />
                <Text>
                  <Trans i18nKey="labs.feature-flags.enabled-count">Enabled feature flags</Trans>
                </Text>
              </Stack>
              <Field
                label={t('labs.feature-flags.search-label', 'Search feature flags')}
                description={t('labs.feature-flags.search-description', 'Filter by feature flag name.')}
                htmlFor="labs-feature-flags-search"
                noMargin
              >
                <Input
                  id="labs-feature-flags-search"
                  value={query}
                  placeholder={t('labs.feature-flags.search-placeholder', 'Search flags')}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                />
              </Field>
            </Stack>
          </Card>

          {rows.length === 0 ? (
            <Alert title={t('labs.feature-flags.empty-title', 'No enabled feature flags')} severity="info">
              <Trans i18nKey="labs.feature-flags.empty-description">
                This Grafana instance did not report any enabled feature flags.
              </Trans>
            </Alert>
          ) : (
            <div className={styles.flagList}>
              {filteredRows.map((row) => (
                <Card key={row.key} noMargin className={styles.flagCard}>
                  <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between">
                    <Stack direction="column" gap={1}>
                      <Stack direction="row" gap={1} alignItems="center">
                        <Text variant="code">{row.key}</Text>
                        <Badge
                          color={row.enabled ? 'green' : 'red'}
                          text={
                            row.enabled
                              ? t('labs.feature-flags.enabled-badge', 'Enabled')
                              : t('labs.feature-flags.disabled-badge', 'Disabled')
                          }
                        />
                        {row.hasOverride && (
                          <Badge color="orange" text={t('labs.feature-flags.override-badge', 'Override')} />
                        )}
                      </Stack>
                      <Text color="secondary">
                        {row.defaultEnabled
                          ? t('labs.feature-flags.default-enabled', 'Enabled by Grafana configuration')
                          : t('labs.feature-flags.local-only', 'Local browser override')}
                      </Text>
                    </Stack>

                    <Stack direction="row" gap={1} alignItems="center">
                      <Switch
                        value={row.enabled}
                        label={t('labs.feature-flags.toggle-label', 'Toggle {{flagName}}', { flagName: row.key })}
                        onChange={(event) => setFlagOverride(row.key, event.currentTarget.checked)}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!row.hasOverride}
                        onClick={() => resetFlagOverride(row.key)}
                      >
                        <Trans i18nKey="labs.feature-flags.reset">Reset</Trans>
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </div>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  summaryCard: css({
    maxWidth: theme.breakpoints.values.md,
  }),
  flagList: css({
    display: 'grid',
    gap: theme.spacing(1),
    maxWidth: theme.breakpoints.values.lg,
  }),
  flagCard: css({
    width: '100%',
  }),
});
