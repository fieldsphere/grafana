import { css } from '@emotion/css';
import { useMemo } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface FeatureFlagRow {
  name: string;
}

function LabsPage() {
  const styles = useStyles2(getStyles);

  const enabledFlags = useMemo(
    () =>
      Object.entries(config.featureToggles)
        .filter(([, enabled]) => enabled)
        .map(([name]) => ({ name }) satisfies FeatureFlagRow)
        .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  return (
    <Page
      navId="labs"
      pageNav={{
        id: 'labs',
        text: t('labs.page.title', 'Labs'),
        subTitle: t('labs.page.description', 'Experimental features currently enabled in your Grafana instance.'),
      }}
      data-testid={selectors.pages.Labs.container}
    >
      <Page.Contents>
        <div className={styles.header}>
          <Text color="secondary">
            <Trans i18nKey="labs.page.count" values={{ count: enabledFlags.length }}>
              {'{{count}} feature flags enabled'}
            </Trans>
          </Text>
        </div>
        {enabledFlags.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <Trans i18nKey="labs.page.table-header">Feature flag</Trans>
                </th>
              </tr>
            </thead>
            <tbody>
              {enabledFlags.map((row) => (
                <tr key={row.name} data-testid={selectors.pages.Labs.table.row(row.name)}>
                  <td>{row.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Text color="secondary">
            <Trans i18nKey="labs.page.empty">No feature flags are currently enabled.</Trans>
          </Text>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  header: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(3),
  }),
  table: css({
    width: '100%',
    borderCollapse: 'collapse',
    th: {
      textAlign: 'left',
      fontWeight: theme.typography.fontWeightMedium,
      padding: theme.spacing(1, 0),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
    },
    td: {
      padding: theme.spacing(1, 0),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
    },
  }),
});

export default LabsPage;
