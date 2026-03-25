import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Alert, useStyles2 } from '@grafana/ui';

export function HomePageBanner() {
  const styles = useStyles2(getStyles);

  if (!config.featureToggles.homePageBanner) {
    return null;
  }

  return (
    <Alert severity="info" title="Welcome to Grafana!" className={styles.banner}>
      <span>
        Explore dashboards, set up data sources, and start monitoring your infrastructure. Visit the{' '}
        <a href="https://grafana.com/docs/" target="_blank" rel="noopener noreferrer" className={styles.link}>
          documentation
        </a>{' '}
        to learn more.
      </span>
    </Alert>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    banner: css({
      flex: 0,
    }),
    link: css({
      color: theme.colors.text.link,
      textDecoration: 'underline',
      '&:hover': {
        textDecoration: 'none',
      },
    }),
  };
}
