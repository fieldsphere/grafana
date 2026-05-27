import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { FeatureState, type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, Button, FilterInput, LoadingPlaceholder, Stack, Switch, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

const FEATURE_TOGGLE_STORAGE_KEY = 'grafana.featureToggles';

export interface FeatureToggleDTO {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  frontendOnly?: boolean;
  requiresRestart?: boolean;
  requiresDevMode?: boolean;
  hideFromDocs?: boolean;
}

export interface FeatureTogglesResponse {
  toggles: FeatureToggleDTO[];
}

type FeatureToggleOverride = Record<string, boolean>;

function getStoredOverrides(): FeatureToggleOverride {
  const stored = window.localStorage.getItem(FEATURE_TOGGLE_STORAGE_KEY);
  if (!stored) {
    return {};
  }

  return stored.split(',').reduce<FeatureToggleOverride>((acc, feature) => {
    const [name, value] = feature.split('=');
    if (name) {
      acc[name] = value === 'true' || value === '1';
    }
    return acc;
  }, {});
}

function persistOverrides(overrides: FeatureToggleOverride) {
  const serialized = Object.entries(overrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join(',');

  if (serialized) {
    window.localStorage.setItem(FEATURE_TOGGLE_STORAGE_KEY, serialized);
  } else {
    window.localStorage.removeItem(FEATURE_TOGGLE_STORAGE_KEY);
  }
}

function isVisibleExperiment(toggle: FeatureToggleDTO) {
  return toggle.stage === FeatureState.experimental || toggle.stage === FeatureState.preview || toggle.stage === 'privatePreview';
}

function getStageBadge(toggle: FeatureToggleDTO) {
  switch (toggle.stage) {
    case FeatureState.experimental:
      return <Badge color="purple" text={t('admin.feature-toggles.stage-experimental', 'Experimental')} />;
    case FeatureState.preview:
      return <Badge color="blue" text={t('admin.feature-toggles.stage-preview', 'Preview')} />;
    case 'privatePreview':
      return <Badge color="blue" text={t('admin.feature-toggles.stage-private-preview', 'Private preview')} />;
    default:
      return <Badge color="darkgrey" text={toggle.stage || t('admin.feature-toggles.stage-unknown', 'Unknown')} />;
  }
}

export function FeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const [overrides, setOverrides] = useState<FeatureToggleOverride>(() => getStoredOverrides());
  const { loading, error, value } = useAsync(
    () => getBackendSrv().get<FeatureTogglesResponse>('/api/admin/feature-toggles'),
    []
  );

  const visibleToggles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (value?.toggles ?? [])
      .filter(isVisibleExperiment)
      .filter((toggle) => {
        return (
          !normalizedQuery ||
          toggle.name.toLowerCase().includes(normalizedQuery) ||
          toggle.description?.toLowerCase().includes(normalizedQuery)
        );
      });
  }, [query, value]);

  const updateOverride = (name: string, enabled: boolean) => {
    setOverrides((current) => {
      const next = { ...current, [name]: enabled };
      persistOverrides(next);
      return next;
    });
  };

  const resetOverrides = () => {
    persistOverrides({});
    setOverrides({});
  };

  return (
    <Page navId="feature-toggles">
      <Page.Contents>
        <Stack direction="column" gap={3}>
          <Text element="h2" variant="h2">
            <Trans i18nKey="admin.feature-toggles.title">Experiments</Trans>
          </Text>

          <Alert severity="info" title={t('admin.feature-toggles.info-title', 'Browser overrides')}>
            <Trans i18nKey="admin.feature-toggles.info-description">
              Toggle experimental Grafana features for this browser only. Changes are saved locally and apply after a
              reload. Server-side and startup features may still require Grafana configuration or a restart.
            </Trans>
          </Alert>

          {error && (
            <Alert severity="error" title={t('admin.feature-toggles.load-error-title', 'Failed to load experiments')}>
              {error.message}
            </Alert>
          )}

          <Stack alignItems="center" justifyContent="space-between" wrap>
            <FilterInput
              width={40}
              placeholder={t('admin.feature-toggles.search-placeholder', 'Search experiments')}
              value={query}
              onChange={setQuery}
            />
            <Stack gap={1}>
              <Button variant="secondary" disabled={Object.keys(overrides).length === 0} onClick={resetOverrides}>
                <Trans i18nKey="admin.feature-toggles.reset-overrides">Reset overrides</Trans>
              </Button>
              <Button onClick={() => window.location.reload()}>
                <Trans i18nKey="admin.feature-toggles.reload">Apply and reload</Trans>
              </Button>
            </Stack>
          </Stack>

          {loading && <LoadingPlaceholder text={t('admin.feature-toggles.loading', 'Loading experiments...')} />}

          {!loading && visibleToggles.length === 0 && (
            <Text color="secondary">
              <Trans i18nKey="admin.feature-toggles.no-results">No experiments match your search.</Trans>
            </Text>
          )}

          <Stack direction="column" gap={2}>
            {visibleToggles.map((toggle) => {
              const hasOverride = Object.prototype.hasOwnProperty.call(overrides, toggle.name);
              const enabled = hasOverride ? overrides[toggle.name] : toggle.enabled;

              return (
                <section
                  aria-label={t('admin.feature-toggles.row-label', '{{name}} feature toggle', { name: toggle.name })}
                  className={styles.toggleCard}
                  key={toggle.name}
                >
                  <Stack alignItems="flex-start" justifyContent="space-between" gap={2}>
                    <Stack direction="column" gap={1}>
                      <Stack alignItems="center" gap={1} wrap>
                        <Text element="h3" variant="h4">
                          {toggle.name}
                        </Text>
                        {getStageBadge(toggle)}
                        {hasOverride && (
                          <Badge color="orange" text={t('admin.feature-toggles.override-badge', 'Override')} />
                        )}
                      </Stack>
                      {toggle.description && <Text color="secondary">{toggle.description}</Text>}
                      <Stack gap={1} wrap>
                        {toggle.frontendOnly ? (
                          <Badge color="green" text={t('admin.feature-toggles.frontend-only', 'Frontend only')} />
                        ) : (
                          <Badge color="orange" text={t('admin.feature-toggles.backend-feature', 'Backend feature')} />
                        )}
                        {toggle.requiresRestart && (
                          <Badge color="orange" text={t('admin.feature-toggles.requires-restart', 'Requires restart')} />
                        )}
                        {toggle.requiresDevMode && (
                          <Badge color="darkgrey" text={t('admin.feature-toggles.requires-dev', 'Requires dev mode')} />
                        )}
                        {toggle.hideFromDocs && (
                          <Badge color="darkgrey" text={t('admin.feature-toggles.hidden-docs', 'Hidden from docs')} />
                        )}
                      </Stack>
                    </Stack>
                    <Switch
                      label={t('admin.feature-toggles.toggle-label', 'Toggle {{name}}', { name: toggle.name })}
                      value={enabled}
                      onChange={(event) => updateOverride(toggle.name, event.currentTarget.checked)}
                    />
                  </Stack>
                </section>
              );
            })}
          </Stack>
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  toggleCard: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    background: theme.colors.background.secondary,
  }),
});

export default FeatureTogglesPage;
