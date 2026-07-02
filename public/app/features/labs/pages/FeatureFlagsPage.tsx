import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getLocalStorageProvider } from '@grafana/runtime/internal';
import { Alert, Badge, Button, Card, Field, Icon, Input, Stack, Switch, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import config from 'app/core/config';

import {
  getFeatureToggleOverrides,
  removeFeatureToggleOverride,
  setFeatureToggleOverride,
  type FeatureToggleOverrides,
} from '../featureToggleOverrides';

type FeatureFlagRow = {
  key: string;
  enabledByConfig: boolean;
  enabled: boolean;
  hasOverride: boolean;
};

const compare = new Intl.Collator('en', { sensitivity: 'base', numeric: true }).compare;

export default function FeatureFlagsPage() {
  const styles = useStyles2(getStyles);
  const [overrides, setOverrides] = useState<FeatureToggleOverrides>(() => getFeatureToggleOverrides());
  const [newFlagKey, setNewFlagKey] = useState('');

  const enabledConfigFlags = useMemo(() => {
    const flags: Record<string, boolean> = {};

    for (const [key, enabled] of Object.entries(config.featureToggles)) {
      if (enabled === true) {
        flags[key] = true;
      }
    }

    return flags;
  }, []);

  const rows = useMemo(() => {
    const keys = new Set([...Object.keys(enabledConfigFlags), ...Object.keys(overrides)]);
    const featureFlags: FeatureFlagRow[] = [];

    for (const key of keys) {
      const hasOverride = Object.prototype.hasOwnProperty.call(overrides, key);
      const enabledByConfig = enabledConfigFlags[key] === true;

      featureFlags.push({
        key,
        enabledByConfig,
        enabled: hasOverride ? overrides[key] : enabledByConfig,
        hasOverride,
      });
    }

    return featureFlags.sort((a, b) => compare(a.key, b.key));
  }, [enabledConfigFlags, overrides]);

  const overrideCount = Object.keys(overrides).length;
  const enabledCount = rows.filter((row) => row.enabled).length;

  const updateFlag = (key: string, enabled: boolean) => {
    getLocalStorageProvider().setFlags({ [key]: enabled });
    setOverrides(setFeatureToggleOverride(key, enabled));
  };

  const resetFlag = (key: string) => {
    getLocalStorageProvider().setFlags({ [key]: undefined });
    setOverrides(removeFeatureToggleOverride(key));
  };

  const addFlag = () => {
    const key = newFlagKey.trim();

    if (!key) {
      return;
    }

    updateFlag(key, true);
    setNewFlagKey('');
  };

  return (
    <Page navId="labs/feature-flags">
      <Page.Contents>
        <div className={styles.page}>
          <Card noMargin className={styles.hero}>
            <Stack alignItems="center" gap={2}>
              <span className={styles.heroIcon}>
                <Icon name="flask" size="xl" />
              </span>
              <div>
                <Text element="h1" variant="h2">
                  <Trans i18nKey="labs.feature-flags.title">Feature flags</Trans>
                </Text>
                <Text color="secondary">
                  <Trans i18nKey="labs.feature-flags.description">
                    Review enabled feature flags and control local overrides for this Grafana session.
                  </Trans>
                </Text>
              </div>
            </Stack>
            <Stack gap={1} wrap>
              <Badge
                color="green"
                text={t('labs.feature-flags.enabled-count', '', {
                  count: enabledCount,
                  defaultValue_one: '{{count}} enabled',
                  defaultValue_other: '{{count}} enabled',
                })}
              />
              <Badge
                color={overrideCount > 0 ? 'orange' : 'darkgrey'}
                text={t('labs.feature-flags.override-count', '', {
                  count: overrideCount,
                  defaultValue_one: '{{count}} local override',
                  defaultValue_other: '{{count}} local overrides',
                })}
              />
            </Stack>
          </Card>

          <Alert
            title={t('labs.feature-flags.local-overrides-title', 'Local controls')}
            severity="info"
            className={styles.alert}
          >
            <Trans i18nKey="labs.feature-flags.local-overrides-description">
              Changes are saved in this browser. OpenFeature flags update immediately, while boot-time feature flags use
              the saved override after reload.
            </Trans>
          </Alert>

          <Card noMargin className={styles.addCard}>
            <Stack direction="row" alignItems="flex-end" gap={2}>
              <Field
                label={t('labs.feature-flags.add-label', 'Add a feature flag override')}
                description={t(
                  'labs.feature-flags.add-description',
                  'Use a feature flag key, for example panelTitleSearch.'
                )}
                className={styles.addField}
                noMargin
              >
                <Input
                  value={newFlagKey}
                  onChange={(event) => setNewFlagKey(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      addFlag();
                    }
                  }}
                  placeholder={t('labs.feature-flags.add-placeholder', 'featureFlagName')}
                />
              </Field>
              <Button icon="plus" onClick={addFlag} disabled={!newFlagKey.trim()}>
                <Trans i18nKey="labs.feature-flags.add-button">Add override</Trans>
              </Button>
            </Stack>
          </Card>

          <Card noMargin className={styles.flagList}>
            <div className={styles.listHeader}>
              <Text variant="h4">
                <Trans i18nKey="labs.feature-flags.enabled-heading">Enabled feature flags</Trans>
              </Text>
              <Text color="secondary">
                <Trans i18nKey="labs.feature-flags.enabled-subheading">
                  Flags enabled by configuration appear here automatically. Local overrides are shown with an override
                  badge.
                </Trans>
              </Text>
            </div>

            {rows.length === 0 ? (
              <div className={styles.emptyState}>
                <Icon name="flask" size="xxl" />
                <Text variant="h4">
                  <Trans i18nKey="labs.feature-flags.empty-title">No enabled feature flags</Trans>
                </Text>
                <Text color="secondary">
                  <Trans i18nKey="labs.feature-flags.empty-description">
                    Add a local override above to test a feature flag in this browser.
                  </Trans>
                </Text>
              </div>
            ) : (
              <div className={styles.rows}>
                {rows.map((row) => (
                  <div className={styles.row} key={row.key}>
                    <div className={styles.flagMeta}>
                      <Text variant="code" truncate>
                        {row.key}
                      </Text>
                      <Stack gap={1} wrap>
                        {row.enabledByConfig && (
                          <Badge color="blue" text={t('labs.feature-flags.config-enabled', 'enabled in config')} />
                        )}
                        {row.hasOverride && (
                          <Badge color="orange" text={t('labs.feature-flags.local-override', 'local override')} />
                        )}
                      </Stack>
                    </div>
                    <Stack alignItems="center" gap={2}>
                      <Switch
                        value={row.enabled}
                        onChange={(event) => updateFlag(row.key, event.currentTarget.checked)}
                        aria-label={t('labs.feature-flags.toggle-label', 'Toggle {{key}}', { key: row.key })}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resetFlag(row.key)}
                        disabled={!row.hasOverride}
                      >
                        <Trans i18nKey="labs.feature-flags.reset-button">Reset</Trans>
                      </Button>
                    </Stack>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  page: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  hero: css({
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    alignItems: 'center',
    flexWrap: 'wrap',
    border: `1px solid ${theme.colors.border.medium}`,
  }),
  heroIcon: css({
    alignItems: 'center',
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.circle,
    color: theme.colors.primary.text,
    display: 'inline-flex',
    height: theme.spacing(5),
    justifyContent: 'center',
    width: theme.spacing(5),
  }),
  alert: css({
    margin: 0,
  }),
  addCard: css({
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  addField: css({
    flex: 1,
    minWidth: theme.spacing(32),
  }),
  flagList: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  listHeader: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  rows: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  row: css({
    alignItems: 'center',
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'space-between',
    padding: theme.spacing(1.5),
  }),
  flagMeta: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  emptyState: css({
    alignItems: 'center',
    color: theme.colors.text.secondary,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(6, 2),
    textAlign: 'center',
  }),
});
