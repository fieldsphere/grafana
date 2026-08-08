import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { InteractiveTable, type Column, useStyles2 } from '@grafana/ui';
import config from 'app/core/config';
import { Page } from 'app/core/components/Page/Page';

type FeatureToggleRow = { name: string; enabled: boolean };

export function LabsPage() {
  const styles = useStyles2(getStyles);
  const toggles = config.featureToggles ?? {};
  const rows: FeatureToggleRow[] = Object.keys(toggles)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, enabled: Boolean(toggles[name as keyof typeof toggles]) }));

  const columns: Array<Column<FeatureToggleRow>> = [
    {
      id: 'name',
      header: t('labs-page.column.name', 'Feature toggle'),
      cell: ({ row: { original: row } }) => <span className={styles.mono}>{row.name}</span>,
    },
    {
      id: 'enabled',
      header: t('labs-page.column.enabled', 'Enabled for you'),
      cell: ({ row: { original: row } }) => (row.enabled ? t('labs-page.enabled.yes', 'Yes') : t('labs-page.enabled.no', 'No')),
    },
  ];

  return (
    <Page navId="labs">
      <Page.Contents>
        <p className={styles.intro}>
          <Trans i18nKey="labs-page.intro">
            Feature toggles exposed to the browser for this organization. Values reflect your current session and server
            configuration.
          </Trans>
        </p>
        <InteractiveTable columns={columns} data={rows} getRowId={(r) => r.name} />
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  intro: css({
    marginBottom: theme.spacing(2),
    maxWidth: '48rem',
    color: theme.colors.text.secondary,
  }),
  mono: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});

export default LabsPage;
