import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { type GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Badge,
  Card,
  FilterInput,
  Icon,
  LoadingPlaceholder,
  RadioButtonGroup,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface FeatureFlag {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  requiresDevMode?: boolean;
  frontendOnly?: boolean;
  requiresRestart?: boolean;
}

type StageFilter = 'all' | 'experimental' | 'privatePreview' | 'preview' | 'GA' | 'deprecated';
type StatusFilter = 'all' | 'enabled' | 'disabled';

const stageOptions = [
  { label: 'All', value: 'all' as StageFilter },
  { label: 'Experimental', value: 'experimental' as StageFilter },
  { label: 'Private Preview', value: 'privatePreview' as StageFilter },
  { label: 'Preview', value: 'preview' as StageFilter },
  { label: 'GA', value: 'GA' as StageFilter },
  { label: 'Deprecated', value: 'deprecated' as StageFilter },
];

const statusOptions = [
  { label: 'All', value: 'all' as StatusFilter },
  { label: 'Enabled', value: 'enabled' as StatusFilter },
  { label: 'Disabled', value: 'disabled' as StatusFilter },
];

function getStageBadgeColor(stage: string): 'blue' | 'orange' | 'purple' | 'green' | 'red' {
  switch (stage) {
    case 'experimental':
      return 'orange';
    case 'privatePreview':
      return 'purple';
    case 'preview':
      return 'blue';
    case 'GA':
      return 'green';
    case 'deprecated':
      return 'red';
    default:
      return 'blue';
  }
}

function getStageDisplayName(stage: string): string {
  switch (stage) {
    case 'experimental':
      return 'Experimental';
    case 'privatePreview':
      return 'Private Preview';
    case 'preview':
      return 'Preview';
    case 'GA':
      return 'Generally Available';
    case 'deprecated':
      return 'Deprecated';
    default:
      return stage;
  }
}

function LabsPage() {
  const styles = useStyles2(getStyles);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { loading, value: flags, error } = useAsync(
    () => getBackendSrv().get<FeatureFlag[]>('/api/featureflags'),
    []
  );

  const filteredFlags = useMemo(() => {
    if (!flags) {
      return [];
    }

    return flags.filter((flag) => {
      const matchesSearch =
        searchQuery === '' ||
        flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flag.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = stageFilter === 'all' || flag.stage === stageFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'enabled' && flag.enabled) ||
        (statusFilter === 'disabled' && !flag.enabled);

      return matchesSearch && matchesStage && matchesStatus;
    });
  }, [flags, searchQuery, stageFilter, statusFilter]);

  const enabledCount = flags?.filter((f) => f.enabled).length ?? 0;
  const totalCount = flags?.length ?? 0;

  return (
    <Page navId="labs">
      <Page.Contents>
        <Alert severity="info" title="Feature Flags">
          Feature flags control experimental and preview features in Grafana. These flags are configured via the Grafana
          configuration file (grafana.ini) or environment variables. Changes require a server restart.
        </Alert>

        <div className={styles.statsRow}>
          <Text variant="body" color="secondary">
            {enabledCount} of {totalCount} feature flags enabled
          </Text>
        </div>

        <div className={styles.filters}>
          <FilterInput
            placeholder="Search feature flags..."
            value={searchQuery}
            onChange={setSearchQuery}
            width={40}
          />
          <div className={styles.filterGroup}>
            <Text variant="bodySmall" color="secondary">
              Stage:
            </Text>
            <RadioButtonGroup options={stageOptions} value={stageFilter} onChange={setStageFilter} size="sm" />
          </div>
          <div className={styles.filterGroup}>
            <Text variant="bodySmall" color="secondary">
              Status:
            </Text>
            <RadioButtonGroup options={statusOptions} value={statusFilter} onChange={setStatusFilter} size="sm" />
          </div>
        </div>

        {loading && <LoadingPlaceholder text="Loading feature flags..." />}

        {error && (
          <Alert severity="error" title="Error loading feature flags">
            {error.message}
          </Alert>
        )}

        {!loading && !error && (
          <div className={styles.flagsGrid}>
            {filteredFlags.length === 0 ? (
              <Text color="secondary">No feature flags match your filters.</Text>
            ) : (
              filteredFlags.map((flag) => (
                <Card key={flag.name} className={styles.card}>
                  <Card.Heading className={styles.cardHeading}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Icon
                        name={flag.enabled ? 'check-circle' : 'circle'}
                        className={flag.enabled ? styles.enabledIcon : styles.disabledIcon}
                      />
                      <span className={styles.flagName}>{flag.name}</span>
                    </Stack>
                  </Card.Heading>
                  <Card.Description className={styles.cardDescription}>
                    {flag.description || 'No description available'}
                  </Card.Description>
                  <Card.Tags className={styles.cardTags}>
                    <Badge text={getStageDisplayName(flag.stage)} color={getStageBadgeColor(flag.stage)} />
                    {flag.enabled && <Badge text="Enabled" color="green" />}
                    {flag.frontendOnly && <Badge text="Frontend Only" color="blue" />}
                    {flag.requiresDevMode && <Badge text="Dev Mode Required" color="orange" />}
                    {flag.requiresRestart && <Badge text="Requires Restart" color="purple" />}
                  </Card.Tags>
                </Card>
              ))
            )}
          </div>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  statsRow: css({
    marginBottom: theme.spacing(2),
  }),
  filters: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
    alignItems: 'center',
  }),
  filterGroup: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  flagsGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: theme.spacing(2),
  }),
  card: css({
    marginBottom: 0,
  }),
  cardHeading: css({
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  cardDescription: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  cardTags: css({
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
  }),
  flagName: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  enabledIcon: css({
    color: theme.colors.success.main,
  }),
  disabledIcon: css({
    color: theme.colors.text.disabled,
  }),
});

export default LabsPage;
