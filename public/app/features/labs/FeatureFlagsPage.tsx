import { css } from '@emotion/css';
import { useEffect, useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Alert, Badge, Button, Input, Switch, useStyles2 } from '@grafana/ui';
import config from 'app/core/config';
import { Page } from 'app/core/components/Page/Page';

const STORAGE_KEY = 'grafana.labs.featureFlagOverrides';

type FeatureFlagOverride = Record<string, boolean>;

interface FeatureFlagRow {
  enabled: boolean;
  name: string;
  overridden: boolean;
}

export function FeatureFlagsPage() {
  return (
    <Page navId="labs-feature-flags">
      <Page.Contents>
        <FeatureFlagsDashboardContent />
      </Page.Contents>
    </Page>
  );
}

export function FeatureFlagsDashboardContent() {
  const styles = useStyles2(getStyles);
  const [filter, setFilter] = useState('');
  const [bootEnabledFlags] = useState(getEnabledFeatureFlagNames);
  const [overrides, setOverrides] = useState(readOverrides);

  useEffect(() => {
    applyOverrides(bootEnabledFlags, overrides);
  }, [bootEnabledFlags, overrides]);

  const flags = useMemo(() => buildRows(bootEnabledFlags, overrides), [bootEnabledFlags, overrides]);
  const filteredFlags = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) {
      return flags;
    }

    return flags.filter((flag) => flag.name.toLowerCase().includes(query));
  }, [filter, flags]);

  const disabledCount = flags.filter((flag) => !flag.enabled).length;
  const overrideCount = Object.keys(overrides).length;

  const updateFlag = (name: string, enabled: boolean) => {
    setOverrides((currentOverrides) => {
      const nextOverrides = { ...currentOverrides };
      if (enabled) {
        delete nextOverrides[name];
      } else {
        nextOverrides[name] = false;
      }
      writeOverrides(nextOverrides);
      return nextOverrides;
    });
  };

  const resetOverrides = () => {
    writeOverrides({});
    setOverrides({});
  };

  return (
    <>
      <Alert
        severity="info"
        title={t('labs.feature-flags.info-title', 'Feature flags dashboard')}
        className={styles.info}
      >
        <Trans i18nKey="labs.feature-flags.info-body">
          Manage feature flags that are enabled for this Grafana session. Changes are applied immediately in this
          browser and saved locally for future visits.
        </Trans>
      </Alert>

      <div className={styles.summary}>
        <SummaryStat label={t('labs.feature-flags.enabled-count', 'Enabled at boot')} value={bootEnabledFlags.length} />
        <SummaryStat label={t('labs.feature-flags.disabled-count', 'Disabled in browser')} value={disabledCount} />
        <SummaryStat label={t('labs.feature-flags.override-count', 'Local overrides')} value={overrideCount} />
      </div>

      <div className={styles.toolbar}>
        <Input
          aria-label={t('labs.feature-flags.search-label', 'Search feature flags')}
          value={filter}
          onChange={(event) => setFilter(event.currentTarget.value)}
          placeholder={t('labs.feature-flags.search-placeholder', 'Search enabled feature flags')}
        />
        <Button variant="secondary" disabled={overrideCount === 0} onClick={resetOverrides}>
          <Trans i18nKey="labs.feature-flags.reset-overrides">Reset browser overrides</Trans>
        </Button>
      </div>

      {filteredFlags.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <Trans i18nKey="labs.feature-flags.table-feature">Feature flag</Trans>
              </th>
              <th>
                <Trans i18nKey="labs.feature-flags.table-status">Status</Trans>
              </th>
              <th className={styles.controlHeader}>
                <Trans i18nKey="labs.feature-flags.table-control">Control</Trans>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFlags.map((flag) => (
              <tr key={flag.name}>
                <td>
                  <div className={styles.flagName}>{flag.name}</div>
                </td>
                <td>
                  <div className={styles.statusCell}>
                    <Badge
                      color={flag.enabled ? 'green' : 'orange'}
                      text={
                        flag.enabled
                          ? t('labs.feature-flags.status-enabled', 'Enabled')
                          : t('labs.feature-flags.status-disabled', 'Disabled locally')
                      }
                    />
                    {flag.overridden && (
                      <Badge color="blue" text={t('labs.feature-flags.status-overridden', 'Browser override')} />
                    )}
                  </div>
                </td>
                <td className={styles.controlCell}>
                  <Switch
                    label={t('labs.feature-flags.toggle-label', 'Toggle {{name}}', { name: flag.name })}
                    value={flag.enabled}
                    onChange={(event) => updateFlag(flag.name, event.currentTarget.checked)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.empty}>
          <Trans i18nKey="labs.feature-flags.empty">No enabled feature flags match your search.</Trans>
        </div>
      )}
    </>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function buildRows(enabledFlagNames: string[], overrides: FeatureFlagOverride): FeatureFlagRow[] {
  return enabledFlagNames.map((name) => ({
    name,
    enabled: overrides[name] ?? true,
    overridden: Object.prototype.hasOwnProperty.call(overrides, name),
  }));
}

function getEnabledFeatureFlagNames() {
  return Object.entries(getFeatureToggles())
    .filter(([, enabled]) => enabled === true)
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b));
}

function applyOverrides(enabledFlagNames: string[], overrides: FeatureFlagOverride) {
  const featureToggles = getFeatureToggles();
  for (const name of enabledFlagNames) {
    featureToggles[name] = overrides[name] ?? true;
  }
}

function getFeatureToggles() {
  return config.featureToggles as Record<string, boolean | undefined>;
}

function readOverrides(): FeatureFlagOverride {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return {};
    }

    const overrides = JSON.parse(value);
    if (!overrides || typeof overrides !== 'object') {
      return {};
    }

    return overrides;
  } catch {
    return {};
  }
}

function writeOverrides(overrides: FeatureFlagOverride) {
  try {
    if (Object.keys(overrides).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Local storage can be unavailable in hardened browsers; the in-session state still updates.
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  info: css({
    marginBottom: theme.spacing(3),
  }),
  summary: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    marginBottom: theme.spacing(3),
  }),
  stat: css({
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
  }),
  statValue: css({
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: theme.typography.h2.lineHeight,
  }),
  statLabel: css({
    color: theme.colors.text.secondary,
  }),
  toolbar: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'minmax(240px, 1fr) auto',
    marginBottom: theme.spacing(2),

    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
    },
  }),
  table: css({
    width: '100%',
    borderCollapse: 'collapse',
    border: `1px solid ${theme.colors.border.weak}`,

    th: {
      background: theme.colors.background.secondary,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeightMedium,
      textAlign: 'left',
    },

    'th, td': {
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      padding: theme.spacing(1.5),
      verticalAlign: 'middle',
    },

    'tbody tr:last-child td': {
      borderBottom: 0,
    },
  }),
  flagName: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  statusCell: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  }),
  controlHeader: css({
    width: theme.spacing(12),
  }),
  controlCell: css({
    textAlign: 'center',
  }),
  empty: css({
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    color: theme.colors.text.secondary,
    padding: theme.spacing(4),
    textAlign: 'center',
  }),
});
