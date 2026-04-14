import { css } from '@emotion/css';
import { useMemo } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Badge, InteractiveTable, Stack, Text, type Column, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import config from 'app/core/config';

type FeatureToggleRow = {
  name: string;
  enabled: boolean;
};

export function LabsPage() {
  const styles = useStyles2(getStyles);

  const rows = useMemo(() => {
    const toggles = config.featureToggles as Record<string, boolean | undefined>;
    return Object.keys(toggles)
      .map((name) => ({ name, enabled: Boolean(toggles[name]) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const columns = useMemo(
    (): Array<Column<FeatureToggleRow>> => [
      {
        id: 'name',
        header: t('labs-page.column.flag', 'Feature flag'),
        cell: ({ row: { original: row } }) => <span className={styles.flagName}>{row.name}</span>,
      },
      {
        id: 'enabled',
        header: t('labs-page.column.enabled', 'Enabled'),
        cell: ({ row: { original: row } }) =>
          row.enabled ? (
            <Badge text={t('labs-page.enabled.yes', 'Yes')} color="green" />
          ) : (
            <Badge text={t('labs-page.enabled.no', 'No')} color="blue" />
          ),
      },
    ],
    [styles.flagName]
  );

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Text element="p">
            <Trans i18nKey="labs-page.intro">
              Values reflect feature toggles exposed to the browser for this Grafana instance (from{' '}
              <code>frontend_settings</code>).
            </Trans>
          </Text>
          <InteractiveTable columns={columns} data={rows} getRowId={(row) => row.name} />
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  flagName: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});

export default LabsPage;
