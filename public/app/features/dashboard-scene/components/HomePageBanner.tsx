import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Alert, TextLink, useStyles2 } from '@grafana/ui';

export function HomePageBanner() {
  const styles = useStyles2(getStyles);

  if (!config.featureToggles.homePageBanner) {
    return null;
  }

  return (
    <Alert
      severity="info"
      title={t('home-page.banner.title', 'Welcome to Grafana!')}
      className={styles.banner}
    >
      <Trans i18nKey="home-page.banner.description">
        Explore dashboards, set up data sources, and start monitoring your infrastructure. Visit the{' '}
        <TextLink href="https://grafana.com/docs/" external>
          documentation
        </TextLink>{' '}
        to learn more.
      </Trans>
    </Alert>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    banner: css({
      flex: 0,
    }),
  };
}
