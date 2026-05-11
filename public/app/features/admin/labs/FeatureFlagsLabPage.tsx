import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import config from 'app/core/config';
import { Page } from 'app/core/components/Page/Page';
import { Alert, Icon, Stack, Text, useStyles2 } from '@grafana/ui';

import { FeatureToggles, getEnabledFeatureFlagNames } from './featureFlagUtils';

export default function FeatureFlagsLabPage() {
  const styles = useStyles2(getStyles);
  const enabledFeatureFlags = getEnabledFeatureFlagNames(config.featureToggles as FeatureToggles);

  return (
    <Page navId="labs/feature-flags">
      <Page.Contents>
        <Stack direction="row" alignItems="center" gap={2} className={styles.header}>
          <Icon name="ai-sparkle" size="xxxl" />
          <div>
            <Text element="h2">Feature flag lab</Text>
            <Text element="p" color="secondary">
              View all currently enabled feature flags in this Grafana instance.
            </Text>
          </div>
        </Stack>

        <Alert severity="info" title="Read-only">
          This page is informational only and does not change server-side feature flag settings.
        </Alert>

        {enabledFeatureFlags.length === 0 ? (
          <Text element="p">No enabled feature flags were found.</Text>
        ) : (
          <ul className={styles.flagsList}>
            {enabledFeatureFlags.map((featureFlag) => (
              <li key={featureFlag} className={styles.flagListItem}>
                <Icon name="ai-sparkle" size="lg" />
                <Text element="span">{featureFlag}</Text>
              </li>
            ))}
          </ul>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    header: css({
      marginBottom: theme.spacing(2),
    }),
    flagsList: css({
      listStyle: 'none',
      margin: theme.spacing(2, 0, 0),
      padding: 0,
    }),
    flagListItem: css({
      alignItems: 'center',
      border: `1px solid ${theme.colors.border.medium}`,
      borderRadius: theme.shape.radius.default,
      display: 'flex',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(1),
      padding: theme.spacing(1),
    }),
  };
};
