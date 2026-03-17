import { css } from '@emotion/css';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

type FeatureToggle = {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  frontendOnly: boolean;
  requiresRestart: boolean;
};

type FeatureTogglesResponse = {
  toggles: FeatureToggle[];
};

const stageColorMap: Record<string, 'blue' | 'green' | 'orange' | 'purple' | 'red'> = {
  experimental: 'orange',
  privatePreview: 'purple',
  preview: 'blue',
  GA: 'green',
  deprecated: 'red',
};

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const { loading, error, value } = useAsync(
    () => getBackendSrv().get<FeatureTogglesResponse>('/api/feature-toggles'),
    []
  );

  return (
    <Page navId="labs">
      <Page.Contents>
        <Alert severity="info" title="">
          <Trans i18nKey="labs-page.info-description">
            Feature toggles are defined in Grafana config and may require a restart before changes take effect.
          </Trans>
        </Alert>

        {loading && <LoadingPlaceholder text={t('labs-page.loading', 'Loading feature flags...')} />}

        {error && (
          <Alert severity="error" title={t('labs-page.error-title', 'Failed to load feature flags')}>
            {error instanceof Error ? error.message : t('labs-page.error-body', 'An unexpected error occurred.')}
          </Alert>
        )}

        {value && (
          <>
            <p className={styles.summary}>
              {t('labs-page.summary', '{{count}} feature flags', { count: value.toggles.length })}
            </p>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('labs-page.columns.name', 'Name')}</th>
                    <th>{t('labs-page.columns.description', 'Description')}</th>
                    <th>{t('labs-page.columns.stage', 'Stage')}</th>
                    <th>{t('labs-page.columns.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {value.toggles.map((toggle) => (
                    <tr key={toggle.name}>
                      <td className={styles.nameCell}>
                        <code>{toggle.name}</code>
                      </td>
                      <td>
                        <div className={styles.descriptionCell}>
                          <span>{toggle.description || t('labs-page.no-description', 'No description provided')}</span>
                          <div className={styles.metaBadges}>
                            {toggle.frontendOnly && (
                              <Badge text={t('labs-page.badges.frontend-only', 'Frontend only')} color="purple" />
                            )}
                            {toggle.requiresRestart && (
                              <Badge text={t('labs-page.badges.restart', 'Requires restart')} color="orange" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge
                          text={toggle.stage}
                          color={stageColorMap[toggle.stage] ?? 'blue'}
                          className={styles.nowrap}
                        />
                      </td>
                      <td>
                        <Badge
                          text={
                            toggle.enabled
                              ? t('labs-page.status.enabled', 'Enabled')
                              : t('labs-page.status.disabled', 'Disabled')
                          }
                          color={toggle.enabled ? 'green' : 'red'}
                          className={styles.nowrap}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  summary: css({
    color: theme.colors.text.secondary,
    margin: theme.spacing(0, 0, 2),
  }),
  tableWrapper: css({
    overflowX: 'auto',
  }),
  table: css({
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    '& th, & td': {
      padding: theme.spacing(1.5),
      textAlign: 'left',
      verticalAlign: 'top',
      borderBottom: `1px solid ${theme.colors.border.weak}`,
    },
    '& th': {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.size.sm,
      fontWeight: theme.typography.fontWeightMedium,
    },
  }),
  nameCell: css({
    width: '22%',
    wordBreak: 'break-word',
  }),
  descriptionCell: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  metaBadges: css({
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  }),
  nowrap: css({
    whiteSpace: 'nowrap',
  }),
});
