import { css } from '@emotion/css';
import { useMemo } from 'react';
import { useAsync } from 'react-use';

import { FeatureState, type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Alert, FeatureBadge, Spinner, Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { getOpenFeatureToggles, type OpenFeatureToggle } from './api';

function stageToFeatureState(stage: string): FeatureState | undefined {
  switch (stage) {
    case 'experimental':
    case 'alpha':
      return FeatureState.experimental;
    case 'preview':
    case 'beta':
      return FeatureState.preview;
    case 'privatePreview':
      return FeatureState.privatePreview;
    default:
      return undefined;
  }
}

function getStyles(theme: GrafanaTheme2) {
  return {
    table: css({
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: theme.spacing(2),
    }),
    headerCell: css({
      textAlign: 'left',
      padding: theme.spacing(1, 2),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    cell: css({
      padding: theme.spacing(1.5, 2),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      verticalAlign: 'top',
    }),
    nameCell: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    enabled: css({
      color: theme.colors.success.text,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    disabled: css({
      color: theme.colors.text.secondary,
    }),
  };
}

function FeatureToggleRow({ toggle, styles }: { toggle: OpenFeatureToggle; styles: ReturnType<typeof getStyles> }) {
  const featureState = stageToFeatureState(toggle.stage);

  return (
    <tr>
      <td className={styles.cell}>
        <Stack direction="row" gap={1} alignItems="center">
          <span className={styles.nameCell}>{toggle.name}</span>
          {featureState && <FeatureBadge featureState={featureState} />}
          {toggle.requiresDevMode && (
            <FeatureBadge
              featureState={FeatureState.experimental}
              tooltip={t('labs.feature-toggles.requires-dev-mode', 'Requires app_mode = development')}
            />
          )}
        </Stack>
      </td>
      <td className={styles.cell}>
        <Text variant="bodySmall" color="secondary">
          {toggle.description}
        </Text>
      </td>
      <td className={styles.cell}>
        <span className={toggle.enabled ? styles.enabled : styles.disabled}>
          {toggle.enabled
            ? t('labs.feature-toggles.enabled', 'Enabled')
            : t('labs.feature-toggles.disabled', 'Disabled')}
        </span>
      </td>
    </tr>
  );
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const { loading, value: toggles, error } = useAsync(() => getOpenFeatureToggles(), []);

  const enabledCount = useMemo(() => toggles?.filter((toggle) => toggle.enabled).length ?? 0, [toggles]);

  return (
    <Page navId="labs">
      <Page.Contents>
        <Text element="h1">
          <Trans i18nKey="labs.title">Labs</Trans>
        </Text>
        <Text color="secondary">
          <Trans i18nKey="labs.description">
            Open feature flags are preview and experimental toggles that are not yet generally available. Enable them in
            your Grafana configuration to try new functionality.
          </Trans>
        </Text>

        {loading && (
          <Stack direction="row" alignItems="center" gap={1}>
            <Spinner />
            <Trans i18nKey="labs.loading">Loading feature flags...</Trans>
          </Stack>
        )}

        {error && (
          <Alert severity="error" title={t('labs.error-title', 'Failed to load feature flags')}>
            <Trans i18nKey="labs.error-message">Could not load open feature flags. Please try again later.</Trans>
          </Alert>
        )}

        {toggles && (
          <>
            <Text color="secondary">
              <Trans i18nKey="labs.summary" values={{ total: toggles.length, enabled: enabledCount }}>
                {'{{enabled}} of {{total}} open feature flags are enabled'}
              </Trans>
            </Text>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.headerCell}>
                    <Trans i18nKey="labs.table.name">Name</Trans>
                  </th>
                  <th className={styles.headerCell}>
                    <Trans i18nKey="labs.table.description">Description</Trans>
                  </th>
                  <th className={styles.headerCell}>
                    <Trans i18nKey="labs.table.status">Status</Trans>
                  </th>
                </tr>
              </thead>
              <tbody>
                {toggles.map((toggle) => (
                  <FeatureToggleRow key={toggle.name} toggle={toggle} styles={styles} />
                ))}
              </tbody>
            </table>
          </>
        )}
      </Page.Contents>
    </Page>
  );
}
