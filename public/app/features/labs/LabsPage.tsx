import { useAsync } from 'react-use';

import { Trans, t } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, EmptyState } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { LabsFeatureFlagsTable } from './LabsFeatureFlagsTable';
import { type LabsFeatureToggle } from './types';

function LabsPage() {
  const { loading, error, value: featureToggles } = useAsync(
    () => getBackendSrv().get<LabsFeatureToggle[]>('/api/labs/feature-toggles'),
    []
  );

  return (
    <Page navId="labs">
      <Page.Contents isLoading={loading}>
        <Alert severity="info" title="">
          <Trans i18nKey="labs.feature-flags.info">
            These feature flags are in an experimental or preview stage. Enable them in your Grafana configuration to try
            new functionality before it becomes generally available.
          </Trans>
        </Alert>

        {error && (
          <Alert severity="error" title={t('labs.feature-flags.error-title', 'Failed to load feature flags')}>
            <Trans i18nKey="labs.feature-flags.error-body">Unable to load open feature flags. Please try again.</Trans>
          </Alert>
        )}

        {!loading && !error && featureToggles?.length === 0 && (
          <EmptyState variant="not-found" message={t('labs.feature-flags.empty', 'No open feature flags found')} />
        )}

        {featureToggles && featureToggles.length > 0 && <LabsFeatureFlagsTable featureToggles={featureToggles} />}
      </Page.Contents>
    </Page>
  );
}

export default LabsPage;
