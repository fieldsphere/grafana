import { css } from '@emotion/css';
import { Fragment } from 'react';
import { useAsync } from 'react-use';

import { t, Trans } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, EmptyState, ScrollContainer, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

export interface LabsFeatureFlag {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  frontendOnly: boolean;
  requiresRestart: boolean;
  runtimeEditable: boolean;
  configured: boolean;
  source: string;
}

export interface LabsFeatureFlagsResponse {
  flags: LabsFeatureFlag[];
  runtimeTogglingSupported: boolean;
  message: string;
}

export function LabsFeatureFlagsPage() {
  const { loading, value } = useAsync(
    () => getBackendSrv().get<LabsFeatureFlagsResponse>('/api/admin/labs/feature-flags'),
    []
  );

  const flags = value?.flags ?? [];

  return (
    <Page navId="labs/feature-flags">
      <Page.Contents>
        <Alert severity="warning" title={t('labs.feature-flags.experimental-title', 'Labs may be unstable')}>
          <Trans i18nKey="labs.feature-flags.experimental-description">
            Labs features are experimental or preview capabilities. Availability and behavior can change between
            releases.
          </Trans>
        </Alert>

        <Alert severity="info" title={t('labs.feature-flags.read-only-title', 'Feature flags are currently read-only')}>
          {value?.message ??
            t(
              'labs.feature-flags.read-only-description',
              'Feature flags shown here can require configuration file changes and server restart to take effect.'
            )}
        </Alert>

        {loading && <LabsFeatureFlagsTableSkeleton />}

        {!loading && flags.length === 0 && (
          <EmptyState
            variant="not-found"
            message={t('labs.feature-flags.empty-message', 'No feature flags are available for this instance')}
          />
        )}

        {!loading && flags.length > 0 && <LabsFeatureFlagsTable flags={flags} />}
      </Page.Contents>
    </Page>
  );
}

interface LabsFeatureFlagsTableProps {
  flags: LabsFeatureFlag[];
}

function LabsFeatureFlagsTable({ flags }: LabsFeatureFlagsTableProps) {
  const styles = useStyles2(getStyles);

  return (
    <ScrollContainer overflowY="visible" overflowX="auto" width="100%">
      <table className="filter-table">
        <thead>
          <tr>
            <th>{t('labs.feature-flags.table.header-name', 'Name')}</th>
            <th>{t('labs.feature-flags.table.header-status', 'Status')}</th>
            <th>{t('labs.feature-flags.table.header-stage', 'Stage')}</th>
            <th>{t('labs.feature-flags.table.header-limitations', 'Limitations')}</th>
            <th>{t('labs.feature-flags.table.header-source', 'Source')}</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((flag) => (
            <Fragment key={flag.name}>
              <tr>
                <td>
                  <Text weight="medium">{flag.name}</Text>
                  {flag.description && (
                    <div className={styles.descriptionCell}>
                      <Text color="secondary">{flag.description}</Text>
                    </div>
                  )}
                </td>
                <td>
                  {flag.enabled ? (
                    <Badge color="green" text={t('labs.feature-flags.status-enabled', 'Enabled')} />
                  ) : (
                    <Badge color="darkgrey" text={t('labs.feature-flags.status-disabled', 'Disabled')} />
                  )}
                </td>
                <td>
                  <Badge color={stageColor(flag.stage)} text={flag.stage || 'unknown'} />
                </td>
                <td>
                  <div className={styles.badgeGroup}>
                    {flag.runtimeEditable ? (
                      <Badge
                        color="green"
                        text={t('labs.feature-flags.limitation-runtime-editable', 'Runtime editable')}
                      />
                    ) : (
                      <Badge
                        color="orange"
                        text={t('labs.feature-flags.limitation-server-managed', 'Server managed')}
                      />
                    )}
                    {flag.requiresRestart && (
                      <Badge
                        color="orange"
                        text={t('labs.feature-flags.limitation-restart-required', 'Restart required')}
                      />
                    )}
                    {flag.frontendOnly && (
                      <Badge color="blue" text={t('labs.feature-flags.limitation-frontend-only', 'Frontend only')} />
                    )}
                  </div>
                </td>
                <td className={styles.sourceCell}>
                  <Text color="secondary">{flag.source}</Text>
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </ScrollContainer>
  );
}

function LabsFeatureFlagsTableSkeleton() {
  const loadingText = t('labs.feature-flags.loading', 'Loading');

  return (
    <ScrollContainer overflowY="visible" overflowX="auto" width="100%">
      <table className="filter-table">
        <tbody>
          {new Array(8).fill(null).map((_, idx) => (
            <tr key={idx}>
              <td>
                <div aria-label={loadingText}>...</div>
              </td>
              <td>...</td>
              <td>...</td>
              <td>...</td>
              <td>...</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollContainer>
  );
}

function stageColor(stage: string) {
  switch (stage) {
    case 'experimental':
      return 'orange';
    case 'privatePreview':
    case 'preview':
      return 'blue';
    case 'GA':
      return 'green';
    case 'deprecated':
      return 'red';
    default:
      return 'darkgrey';
  }
}

const getStyles = () => {
  return {
    badgeGroup: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
    }),
    descriptionCell: css({
      marginTop: '4px',
      whiteSpace: 'break-spaces',
    }),
    sourceCell: css({
      whiteSpace: 'nowrap',
    }),
  };
};

export default LabsFeatureFlagsPage;
