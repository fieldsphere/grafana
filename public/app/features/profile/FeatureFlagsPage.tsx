import { css } from '@emotion/css';
import { useEffect, useMemo, useState } from 'react';

import {
  featureToggleMeta,
  type FeatureToggleMeta,
  type FeatureToggleDefaultValue,
  type GrafanaTheme2,
  type SelectableValue,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Alert, Badge, Button, Field, Input, Select, Stack, Switch, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import {
  clearAllFeatureToggleOverrides,
  clearFeatureToggleOverride,
  type FeatureToggleValue,
  fetchServerFeatureToggleValues,
  getEffectiveFeatureToggleValue,
  readFeatureToggleOverrides,
  setFeatureToggleOverride,
  type FeatureToggleOverrideMap,
} from './featureFlagOverrides';

type StageFilter = string;

const ALL_STAGES = '';

export default function FeatureFlagsPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>(ALL_STAGES);
  const [overriddenOnly, setOverriddenOnly] = useState(false);
  const [frontendOnly, setFrontendOnly] = useState(false);
  const [requiresRestartOnly, setRequiresRestartOnly] = useState(false);
  const [overrides, setOverrides] = useState<FeatureToggleOverrideMap>(() => readFeatureToggleOverrides());
  const [serverValues, setServerValues] = useState<Record<string, FeatureToggleValue>>(() => ({
    ...config.featureTogglesFromServer,
  }));
  const [fetchError, setFetchError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingReload, setHasPendingReload] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchServerFeatureToggleValues()
      .then((values) => {
        if (!isMounted) {
          return;
        }

        setServerValues((current) => ({ ...current, ...values }));
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }

        setFetchError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stageOptions = useMemo<Array<SelectableValue<string>>>(() => {
    const stages = Array.from(new Set(featureToggleMeta.map((flag) => flag.stage))).sort();
    return [
      { label: t('profile.feature-flags.stage-filter.all', 'All stages'), value: ALL_STAGES },
      ...stages.map((stage) => ({ label: stage, value: stage })),
    ];
  }, []);

  const fallbackValues = useMemo(() => getFallbackValues(serverValues), [serverValues]);

  const filteredFlags = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return featureToggleMeta.filter((flag) => {
      if (stageFilter && flag.stage !== stageFilter) {
        return false;
      }

      if (overriddenOnly && !Object.prototype.hasOwnProperty.call(overrides, flag.name)) {
        return false;
      }

      if (frontendOnly && !flag.frontendOnly) {
        return false;
      }

      if (requiresRestartOnly && !flag.requiresRestart) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [flag.name, flag.description, flag.owner, flag.stage].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [frontendOnly, overriddenOnly, overrides, query, requiresRestartOnly, stageFilter]);

  const handleToggle = (flag: FeatureToggleMeta, enabled: boolean) => {
    setOverrides(setFeatureToggleOverride(flag.name, enabled));
    setHasPendingReload(true);
  };

  const handleReset = (flag: FeatureToggleMeta) => {
    setOverrides(clearFeatureToggleOverride(flag.name, fallbackValues[flag.name]));
    setHasPendingReload(true);
  };

  const handleResetAll = () => {
    setOverrides(clearAllFeatureToggleOverrides(fallbackValues));
    setHasPendingReload(true);
  };

  return (
    <Page navId="profile/feature-toggles">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('profile.feature-flags.browser-overrides-title', 'Browser feature flags')}>
            {t(
              'profile.feature-flags.browser-overrides-description',
              'These controls use Grafana’s existing browser override system and do not edit server configuration. Reload after changes to make boot-time feature checks consistent. Backend-only or restart-required flags may still require server configuration changes for server-side behavior.'
            )}
          </Alert>

          {fetchError && (
            <Alert
              severity="warning"
              title={t('profile.feature-flags.server-values-failed-title', 'Could not load server feature flag values')}
            >
              {t(
                'profile.feature-flags.server-values-failed-description',
                'Showing registry defaults and any browser overrides instead. Error: {{error}}',
                { error: fetchError }
              )}
            </Alert>
          )}

          {hasPendingReload && (
            <Alert severity="success" title={t('profile.feature-flags.reload-title', 'Feature flag override saved')}>
              <Stack direction="row" alignItems="center" gap={2}>
                <span>
                  {t(
                    'profile.feature-flags.reload-description',
                    'Reload Grafana to apply this override everywhere in the frontend.'
                  )}
                </span>
                <Button size="sm" onClick={() => window.location.reload()}>
                  {t('profile.feature-flags.reload-button', 'Reload now')}
                </Button>
              </Stack>
            </Alert>
          )}

          <div className={styles.toolbar}>
            <Field
              label={t('profile.feature-flags.search-label', 'Search feature flags')}
              className={styles.searchField}
            >
              <Input
                aria-label={t('profile.feature-flags.search-label', 'Search feature flags')}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder={t(
                  'profile.feature-flags.search-placeholder',
                  'Search by name, description, owner, or stage'
                )}
              />
            </Field>

            <Field label={t('profile.feature-flags.stage-label', 'Stage')} className={styles.stageField}>
              <Select
                options={stageOptions}
                value={stageFilter}
                onChange={(option) => setStageFilter(option.value ?? ALL_STAGES)}
              />
            </Field>

            <Button variant="secondary" disabled={Object.keys(overrides).length === 0} onClick={handleResetAll}>
              {t('profile.feature-flags.reset-all', 'Reset all browser overrides')}
            </Button>
          </div>

          <div className={styles.filterRow}>
            <label className={styles.filterLabel}>
              <input
                type="checkbox"
                checked={overriddenOnly}
                onChange={(event) => setOverriddenOnly(event.currentTarget.checked)}
              />
              {t('profile.feature-flags.overridden-only', 'Overridden only')}
            </label>
            <label className={styles.filterLabel}>
              <input
                type="checkbox"
                checked={frontendOnly}
                onChange={(event) => setFrontendOnly(event.currentTarget.checked)}
              />
              {t('profile.feature-flags.frontend-only', 'Frontend only')}
            </label>
            <label className={styles.filterLabel}>
              <input
                type="checkbox"
                checked={requiresRestartOnly}
                onChange={(event) => setRequiresRestartOnly(event.currentTarget.checked)}
              />
              {t('profile.feature-flags.requires-restart-only', 'Requires restart')}
            </label>
          </div>

          <div className={styles.summary}>
            {isLoading
              ? t('profile.feature-flags.loading', 'Loading current values…')
              : t('profile.feature-flags.summary', '{{shown}} of {{total}} flags shown', {
                  shown: filteredFlags.length,
                  total: featureToggleMeta.length,
                })}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('profile.feature-flags.table.flag', 'Flag')}</th>
                  <th>{t('profile.feature-flags.table.state', 'State')}</th>
                  <th>{t('profile.feature-flags.table.source', 'Source')}</th>
                  <th>{t('profile.feature-flags.table.metadata', 'Metadata')}</th>
                  <th>{t('profile.feature-flags.table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlags.map((flag) => (
                  <FeatureFlagRow
                    key={flag.name}
                    flag={flag}
                    overrides={overrides}
                    serverValue={serverValues[flag.name]}
                    onReset={handleReset}
                    onToggle={handleToggle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Stack>
      </Page.Contents>
    </Page>
  );
}

type FeatureFlagRowProps = {
  flag: FeatureToggleMeta;
  overrides: FeatureToggleOverrideMap;
  serverValue: FeatureToggleValue;
  onReset: (flag: FeatureToggleMeta) => void;
  onToggle: (flag: FeatureToggleMeta, enabled: boolean) => void;
};

function FeatureFlagRow({ flag, overrides, serverValue, onReset, onToggle }: FeatureFlagRowProps) {
  const styles = useStyles2(getStyles);
  const hasOverride = Object.prototype.hasOwnProperty.call(overrides, flag.name);
  const effectiveValue = getEffectiveFeatureToggleValue(flag.name, serverValue, flag.defaultValue, overrides);
  const isBoolean = typeof effectiveValue === 'boolean' || typeof flag.defaultValue === 'boolean';
  const enabled = effectiveValue === true;

  return (
    <tr>
      <th scope="row">
        <Stack direction="column" gap={0.5}>
          <span className={styles.flagName}>{flag.name}</span>
          <span className={styles.description}>{flag.description}</span>
          <span className={styles.defaultValue}>
            {t('profile.feature-flags.default-value', 'Default: {{value}}', { value: formatValue(flag.defaultValue) })}
          </span>
        </Stack>
      </th>
      <td>
        {isBoolean ? (
          <Switch
            data-testid={`feature-toggle-${flag.name}`}
            value={enabled}
            onChange={(event) => onToggle(flag, event.currentTarget.checked)}
            aria-label={t('profile.feature-flags.toggle-label', 'Toggle {{flagName}}', { flagName: flag.name })}
          />
        ) : (
          <span>{formatValue(effectiveValue)}</span>
        )}
      </td>
      <td>
        <Badge
          color={hasOverride ? 'orange' : 'blue'}
          text={
            hasOverride
              ? t('profile.feature-flags.source.browser', 'Browser override')
              : t('profile.feature-flags.source.server', 'Server/config')
          }
        />
      </td>
      <td>
        <Stack direction="column" gap={0.5}>
          <Stack direction="row" gap={0.5} wrap>
            <Badge color="purple" text={flag.stage} />
            <Badge
              color={flag.frontendOnly ? 'green' : 'darkgrey'}
              text={
                flag.frontendOnly
                  ? t('profile.feature-flags.frontend-badge', 'Frontend')
                  : t('profile.feature-flags.backend-badge', 'Backend aware')
              }
            />
            {flag.requiresRestart && (
              <Badge
                color="orange"
                text={t('profile.feature-flags.requires-restart-badge', 'Requires restart')}
                tooltip={t(
                  'profile.feature-flags.restart-tooltip',
                  'This flag is read during server startup. Browser overrides can affect frontend reads, but server-side behavior still requires config and restart.'
                )}
              />
            )}
            {flag.requiresDevMode && (
              <Badge color="orange" text={t('profile.feature-flags.requires-dev-mode', 'Dev mode')} />
            )}
          </Stack>
          <span className={styles.owner}>{flag.owner}</span>
        </Stack>
      </td>
      <td>
        <Button variant="secondary" size="sm" disabled={!hasOverride} onClick={() => onReset(flag)}>
          {t('profile.feature-flags.reset', 'Reset')}
        </Button>
      </td>
    </tr>
  );
}

function getFallbackValues(serverValues: Record<string, FeatureToggleValue>): Record<string, FeatureToggleValue> {
  return featureToggleMeta.reduce<Record<string, FeatureToggleValue>>((acc, flag) => {
    acc[flag.name] = serverValues[flag.name] ?? flag.defaultValue;
    return acc;
  }, {});
}

function formatValue(value: FeatureToggleValue | FeatureToggleDefaultValue): string {
  if (value === undefined) {
    return t('profile.feature-flags.value-undefined', 'undefined');
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

function getStyles(theme: GrafanaTheme2) {
  return {
    toolbar: css({
      alignItems: 'end',
      display: 'grid',
      gap: theme.spacing(2),
      gridTemplateColumns: 'minmax(240px, 1fr) minmax(180px, 240px) auto',

      [theme.breakpoints.down('md')]: {
        alignItems: 'stretch',
        gridTemplateColumns: '1fr',
      },
    }),
    searchField: css({
      marginBottom: 0,
    }),
    stageField: css({
      marginBottom: 0,
    }),
    filterRow: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(2),
    }),
    filterLabel: css({
      alignItems: 'center',
      color: theme.colors.text.secondary,
      display: 'flex',
      gap: theme.spacing(0.75),
    }),
    summary: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    tableWrap: css({
      overflowX: 'auto',
    }),
    table: css({
      borderCollapse: 'collapse',
      minWidth: '920px',
      width: '100%',

      'th, td': {
        borderBottom: `1px solid ${theme.colors.border.weak}`,
        padding: theme.spacing(1.5),
        textAlign: 'left',
        verticalAlign: 'top',
      },

      thead: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.bodySmall.fontSize,
      },
    }),
    flagName: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    description: css({
      color: theme.colors.text.secondary,
      maxWidth: '520px',
    }),
    defaultValue: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    owner: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
  };
}
