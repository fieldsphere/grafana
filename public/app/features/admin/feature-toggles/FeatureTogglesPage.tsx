import { css } from '@emotion/css';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import {
  Alert,
  Badge,
  FilterInput,
  Icon,
  RadioButtonGroup,
  Switch,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import {
  clearFeatureToggleOverride,
  getFeatureToggles,
  setFeatureToggle,
  type FeatureToggleState,
  type FeatureToggleStatus,
} from './api';

const TEAM_STAGES = new Set(['experimental', 'privatePreview', 'preview']);

type StageFilter = 'team' | 'all';

export default function FeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const canWrite = contextSrv.hasPermission(AccessControlAction.FeatureManagementWrite);
  const [state, setState] = useState<FeatureToggleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('team');
  const [savingFlag, setSavingFlag] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFeatureToggles();
      setState(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredToggles = useMemo(() => {
    const toggles = state?.toggles ?? [];
    const query = search.trim().toLowerCase();

    return toggles.filter((toggle) => {
      if (stageFilter === 'team' && !TEAM_STAGES.has(toggle.stage)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        toggle.name.toLowerCase().includes(query) ||
        toggle.description?.toLowerCase().includes(query) ||
        toggle.stage.toLowerCase().includes(query)
      );
    });
  }, [search, stageFilter, state?.toggles]);

  const onToggle = async (toggle: FeatureToggleStatus, enabled: boolean) => {
    if (!toggle.writeable || !canWrite) {
      return;
    }

    setSavingFlag(toggle.name);
    setError(null);
    try {
      const response = await setFeatureToggle(toggle.name, enabled);
      setState(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feature flag');
    } finally {
      setSavingFlag(null);
    }
  };

  const onClearOverride = async (toggle: FeatureToggleStatus) => {
    if (!toggle.writeable || !canWrite || toggle.source?.kind !== 'override') {
      return;
    }

    setSavingFlag(toggle.name);
    setError(null);
    try {
      const response = await clearFeatureToggleOverride(toggle.name);
      setState(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear feature flag override');
    } finally {
      setSavingFlag(null);
    }
  };

  return (
    <Page navId="feature-flag-lab">
      <Page.Contents isLoading={loading}>
        <div className={styles.hero}>
          <Icon name="flask" size="xxxl" className={styles.heroIcon} />
          <div>
            <h1 className={styles.heroTitle}>
              <Trans i18nKey="admin.feature-toggles.title">Feature Flag Lab</Trans>
            </h1>
            <p className={styles.heroSubtitle}>
              <Trans i18nKey="admin.feature-toggles.subtitle">
                Turn team feature flags on or off for this Grafana instance. Changes are persisted on the server.
              </Trans>
            </p>
          </div>
        </div>

        {state?.restartRequired && (
          <Alert severity="warning" title={t('admin.feature-toggles.restart-required', 'Restart required')}>
            <Trans i18nKey="admin.feature-toggles.restart-required-body">
              Some feature flags require a Grafana restart before pending changes take effect.
            </Trans>
          </Alert>
        )}

        {error && (
          <Alert severity="error" title={t('admin.feature-toggles.error', 'Unable to update feature flags')}>
            {error}
          </Alert>
        )}

        <div className={styles.controls}>
          <FilterInput
            placeholder={t('admin.feature-toggles.search-placeholder', 'Search feature flags')}
            value={search}
            onChange={setSearch}
          />
          <RadioButtonGroup
            options={[
              { label: t('admin.feature-toggles.filter-team', 'Team flags'), value: 'team' },
              { label: t('admin.feature-toggles.filter-all', 'All flags'), value: 'all' },
            ]}
            value={stageFilter}
            onChange={(value) => setStageFilter(value as StageFilter)}
          />
        </div>

        <div className={styles.table}>
          <div className={styles.headerRow}>
            <span>
              <Trans i18nKey="admin.feature-toggles.column-flag">Flag</Trans>
            </span>
            <span>
              <Trans i18nKey="admin.feature-toggles.column-stage">Stage</Trans>
            </span>
            <span>
              <Trans i18nKey="admin.feature-toggles.column-source">Source</Trans>
            </span>
            <span>
              <Trans i18nKey="admin.feature-toggles.column-enabled">Enabled</Trans>
            </span>
          </div>

          {filteredToggles.map((toggle) => {
            const isSaving = savingFlag === toggle.name;
            const isConfigured = toggle.source?.kind === 'configured';
            const hasPending =
              toggle.pendingEnabled !== undefined && toggle.pendingEnabled !== toggle.enabled;

            return (
              <div key={toggle.name} className={styles.row} data-testid={`feature-flag-row-${toggle.name}`}>
                <div className={styles.flagCell}>
                  <strong>{toggle.name}</strong>
                  {toggle.description && <div className={styles.description}>{toggle.description}</div>}
                  {toggle.warning && <div className={styles.warning}>{toggle.warning}</div>}
                </div>
                <div>{toggle.stage}</div>
                <div className={styles.sourceCell}>
                  <Badge text={toggle.source?.kind ?? 'default'} color="blue" />
                  {toggle.requiresRestart && (
                    <Badge
                      text={t('admin.feature-toggles.restart-badge', 'Restart')}
                      color="orange"
                      className={styles.badgeSpacing}
                    />
                  )}
                  {hasPending && (
                    <Badge
                      text={t('admin.feature-toggles.pending-badge', 'Pending: {{value}}', {
                        value: String(toggle.pendingEnabled),
                      })}
                      color="purple"
                      className={styles.badgeSpacing}
                    />
                  )}
                </div>
                <div className={styles.switchCell}>
                  <Switch
                    value={toggle.enabled}
                    disabled={!toggle.writeable || !canWrite || isSaving || isConfigured}
                    onChange={(event) => onToggle(toggle, event.currentTarget.checked)}
                  />
                  {toggle.source?.kind === 'override' && toggle.writeable && canWrite && (
                    <button
                      type="button"
                      className={styles.clearButton}
                      disabled={isSaving}
                      onClick={() => onClearOverride(toggle)}
                    >
                      <Trans i18nKey="admin.feature-toggles.clear-override">Clear override</Trans>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  hero: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(3),
    marginBottom: theme.spacing(3),
  }),
  heroIcon: css({
    color: theme.colors.warning.text,
    flexShrink: 0,
  }),
  heroTitle: css({
    margin: 0,
    fontSize: theme.typography.h2.fontSize,
  }),
  heroSubtitle: css({
    margin: `${theme.spacing(1)} 0 0`,
    color: theme.colors.text.secondary,
    maxWidth: '720px',
  }),
  controls: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
    alignItems: 'center',
  }),
  table: css({
    display: 'grid',
    gap: theme.spacing(1),
  }),
  headerRow: css({
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: theme.spacing(2),
    padding: theme.spacing(1, 2),
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.secondary,
  }),
  row: css({
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: theme.spacing(2),
    alignItems: 'center',
    padding: theme.spacing(2),
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
  }),
  flagCell: css({
    minWidth: 0,
  }),
  description: css({
    color: theme.colors.text.secondary,
    marginTop: theme.spacing(0.5),
  }),
  warning: css({
    color: theme.colors.warning.text,
    marginTop: theme.spacing(0.5),
  }),
  sourceCell: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
  }),
  badgeSpacing: css({
    marginLeft: theme.spacing(0.5),
  }),
  switchCell: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  clearButton: css({
    background: 'none',
    border: 'none',
    color: theme.colors.text.link,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  }),
});
