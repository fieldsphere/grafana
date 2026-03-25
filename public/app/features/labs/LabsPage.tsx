import { css } from '@emotion/css';
import { useMemo } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

function getStyles(theme: GrafanaTheme2) {
  return {
    intro: css({
      marginBottom: theme.spacing(2),
      maxWidth: 720,
    }),
    list: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: 1.5,
      margin: 0,
      padding: theme.spacing(2),
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.shape.borderRadius(),
      border: `1px solid ${theme.colors.border.weak}`,
      overflow: 'auto',
      maxHeight: '70vh',
    }),
    empty: css({
      marginTop: theme.spacing(1),
    }),
  };
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);

  const enabledFlags = useMemo(() => {
    const toggles = config.featureToggles ?? {};
    return Object.keys(toggles)
      .filter((key) => toggles[key])
      .sort((a, b) => a.localeCompare(b));
  }, []);

  return (
    <Page navId="labs">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          <div>
            <Text element="h1" variant="h1">
              <Trans i18nKey="labs.page.title">Labs</Trans>
            </Text>
            <Text element="p" variant="body" className={styles.intro}>
              <Trans i18nKey="labs.page.description">
                Feature flags that are enabled for this Grafana instance in the browser session. Only flags that are
                on are listed here.
              </Trans>
            </Text>
          </div>
          {enabledFlags.length === 0 ? (
            <Text element="p" variant="body" className={styles.empty}>
              <Trans i18nKey="labs.page.no-flags">No enabled feature flags are exposed to the frontend.</Trans>
            </Text>
          ) : (
            <pre className={styles.list} data-testid="labs-enabled-flags">
              {enabledFlags.join('\n')}
            </pre>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}
