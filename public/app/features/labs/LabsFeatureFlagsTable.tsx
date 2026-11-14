import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Badge, type CellProps, type Column, InteractiveTable, Text, useStyles2 } from '@grafana/ui';

import { type LabsFeatureToggle } from './types';

const stageLabel = (stage: string) => {
  switch (stage) {
    case 'experimental':
      return t('labs.feature-flags.stage.experimental', 'Experimental');
    case 'preview':
      return t('labs.feature-flags.stage.preview', 'Public preview');
    case 'privatePreview':
      return t('labs.feature-flags.stage.private-preview', 'Private preview');
    default:
      return stage;
  }
};

const stageColor = (stage: string): 'orange' | 'blue' | 'purple' | 'darkgrey' => {
  switch (stage) {
    case 'experimental':
      return 'orange';
    case 'preview':
      return 'blue';
    case 'privatePreview':
      return 'purple';
    default:
      return 'darkgrey';
  }
};

interface Props {
  featureToggles: LabsFeatureToggle[];
}

export function LabsFeatureFlagsTable({ featureToggles }: Props) {
  const styles = useStyles2(getStyles);

  const columns: Array<Column<LabsFeatureToggle>> = [
    {
      id: 'name',
      header: t('labs.feature-flags.table.name', 'Name'),
      cell: ({ cell: { value } }: CellProps<LabsFeatureToggle, string>) => (
        <Text variant="code" truncate>
          {value}
        </Text>
      ),
    },
    {
      id: 'description',
      header: t('labs.feature-flags.table.description', 'Description'),
      cell: ({ cell: { value } }: CellProps<LabsFeatureToggle, string>) => <Text>{value}</Text>,
    },
    {
      id: 'stage',
      header: t('labs.feature-flags.table.stage', 'Stage'),
      cell: ({ cell: { value } }: CellProps<LabsFeatureToggle, string>) => (
        <Badge color={stageColor(value)} text={stageLabel(value)} />
      ),
    },
    {
      id: 'enabled',
      header: t('labs.feature-flags.table.status', 'Status'),
      cell: ({ cell: { value } }: CellProps<LabsFeatureToggle, boolean>) => (
        <Badge
          color={value ? 'green' : 'red'}
          text={
            value
              ? t('labs.feature-flags.status.enabled', 'Enabled')
              : t('labs.feature-flags.status.disabled', 'Disabled')
          }
        />
      ),
    },
  ];

  return (
    <div className={styles.table}>
      <InteractiveTable columns={columns} data={featureToggles} getRowId={(toggle) => toggle.name} />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  table: css({
    marginTop: theme.spacing(2),
  }),
});
