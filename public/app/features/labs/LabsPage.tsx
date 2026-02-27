import type { FeatureToggles } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Alert, Stack, Text, TextLink } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

const collator = new Intl.Collator('en');

export function getActiveFeatureFlags(featureToggles: FeatureToggles | Record<string, boolean | undefined>) {
  return Object.entries(featureToggles)
    .filter(([, enabled]) => enabled === true)
    .map(([flag]) => flag)
    .sort((left, right) => collator.compare(left, right));
}

interface LabsPageProps {
  featureToggles?: FeatureToggles | Record<string, boolean | undefined>;
}

export default function LabsPage({ featureToggles = config.featureToggles ?? {} }: LabsPageProps) {
  const activeFeatureFlags = getActiveFeatureFlags(featureToggles);

  return (
    <Page navId="labs" pageNav={{ text: t('labs.page-nav', 'Labs') }}>
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <Text variant="h4">
            <Trans i18nKey="labs.active-feature-flags">Active feature flags</Trans>
          </Text>
          <Text variant="body">
            <Trans i18nKey="labs.enabled-feature-flags-description">
              This page shows feature flags currently enabled for your Grafana instance.
            </Trans>
            <br />
            <Trans i18nKey="labs.manage-feature-toggle-description">
              Manage feature toggles in your configuration file:
            </Trans>
            <br />
            <TextLink href="https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/feature-toggles/">
              <Trans i18nKey="labs.feature-toggles-documentation">Feature toggles documentation</Trans>
            </TextLink>
          </Text>
          {activeFeatureFlags.length === 0 ? (
            <Alert severity="info" title={t('labs.no-active-feature-flags-title', 'No active feature flags')}>
              <Trans i18nKey="labs.no-active-feature-flags-description">
                There are no enabled feature flags in this instance.
              </Trans>
            </Alert>
          ) : (
            <ul>
              {activeFeatureFlags.map((flag) => (
                <li key={flag}>
                  <code>{flag}</code>
                </li>
              ))}
            </ul>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}
