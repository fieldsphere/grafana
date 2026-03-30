import { css } from '@emotion/css';

import { GrafanaTheme2, locationUtil } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { LinkButton, Stack, Text, useStyles2 } from '@grafana/ui';

const UTM = 'utm_source=grafana_gettingstarted';

const grafanaCloudSignupUrl = `https://grafana.com/auth/sign-up/create-user?src=oss-grafana&cnt=welcome-home&${UTM}`;

export const WelcomeBanner = () => {
  const styles = useStyles2(getStyles);
  const createDashboardHref = locationUtil.assureBaseUrl('/dashboard/new');
  const exploreHref = locationUtil.assureBaseUrl('/explore');

  return (
    <div className={styles.scroll}>
      <div className={styles.inner}>
        <section className={styles.hero} aria-labelledby="welcome-hero-title">
          <Stack direction="column" gap={1}>
            <h1 id="welcome-hero-title" className={styles.heroTitle}>
              <Trans i18nKey="welcome.welcome-banner.welcome-to-grafana">Welcome to Grafana</Trans>
            </h1>
            <Text variant="body" color="secondary">
              <Trans i18nKey="welcome.welcome-banner.subtitle">
                The open platform for observability—query, visualize, and alert on your data wherever it lives.
              </Trans>
            </Text>
          </Stack>
        </section>

        <section className={styles.pillars} aria-labelledby="welcome-pillars-heading">
          <h2 id="welcome-pillars-heading" className={styles.sectionHeading}>
            <Trans i18nKey="welcome.welcome-banner.pillars-heading">Why teams choose Grafana</Trans>
          </h2>
          <div className={styles.pillarGrid}>
            <div className={styles.pillarCard}>
              <h3 className={styles.pillarTitle}>
                <Trans i18nKey="welcome.welcome-banner.pillar-visualize-title">Visualize and alert</Trans>
              </h3>
              <Text element="p" variant="bodySmall" color="secondary">
                <Trans i18nKey="welcome.welcome-banner.pillar-visualize-body">
                  Build dashboards and alert on metrics, logs, traces, and profiles in one place.
                </Trans>
              </Text>
            </div>
            <div className={styles.pillarCard}>
              <h3 className={styles.pillarTitle}>
                <Trans i18nKey="welcome.welcome-banner.pillar-unify-title">Unify your data</Trans>
              </h3>
              <Text element="p" variant="bodySmall" color="secondary">
                <Trans i18nKey="welcome.welcome-banner.pillar-unify-body">
                  Connect 100+ data sources and query without switching tools.
                </Trans>
              </Text>
            </div>
            <div className={styles.pillarCard}>
              <h3 className={styles.pillarTitle}>
                <Trans i18nKey="welcome.welcome-banner.pillar-collaborate-title">Collaborate</Trans>
              </h3>
              <Text element="p" variant="bodySmall" color="secondary">
                <Trans i18nKey="welcome.welcome-banner.pillar-collaborate-body">
                  Share dashboards and foster a data-driven culture with your team.
                </Trans>
              </Text>
            </div>
          </div>
        </section>

        <section className={styles.stats} aria-labelledby="welcome-stats-heading">
          <h2 id="welcome-stats-heading" className="sr-only">
            <Trans i18nKey="welcome.welcome-banner.stats-heading">At a glance</Trans>
          </h2>
          <div className={styles.statRow}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                <Trans i18nKey="welcome.welcome-banner.stat-sources-value">100+</Trans>
              </div>
              <Text variant="bodySmall" color="secondary">
                <Trans i18nKey="welcome.welcome-banner.stat-sources-label">Data sources</Trans>
              </Text>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                <Trans i18nKey="welcome.welcome-banner.stat-viz-value">Many</Trans>
              </div>
              <Text variant="bodySmall" color="secondary">
                <Trans i18nKey="welcome.welcome-banner.stat-viz-label">Visualization types</Trans>
              </Text>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                <Trans i18nKey="welcome.welcome-banner.stat-oss-value">Open source</Trans>
              </div>
              <Text variant="bodySmall" color="secondary">
                <Trans i18nKey="welcome.welcome-banner.stat-oss-label">Core platform</Trans>
              </Text>
            </div>
          </div>
        </section>

        <section className={styles.ctas} aria-label={t('welcome.welcome-banner.cta-section-aria', 'Get started')}>
          <Stack direction="row" gap={2} wrap alignItems="center">
            <LinkButton href={grafanaCloudSignupUrl} variant="primary" icon="cloud" target="_blank" rel="noreferrer">
              <Trans i18nKey="welcome.welcome-banner.cta-cloud">Try Grafana Cloud</Trans>
            </LinkButton>
            <LinkButton href={createDashboardHref} variant="secondary" icon="plus">
              <Trans i18nKey="welcome.welcome-banner.cta-create-dashboard">Create a dashboard</Trans>
            </LinkButton>
            <LinkButton href={exploreHref} fill="outline" icon="compass">
              <Trans i18nKey="welcome.welcome-banner.cta-explore">Explore</Trans>
            </LinkButton>
          </Stack>
        </section>

        <div className={styles.help}>
          <h3 className={styles.helpText}>
            <Trans i18nKey="welcome.welcome-banner.need-help">Need help?</Trans>
          </h3>
          <div className={styles.helpLinks}>
            <a className={styles.helpLink} href={`https://grafana.com/docs/grafana/latest?${UTM}`}>
              <Trans i18nKey="welcome.welcome-banner.link-documentation">Documentation</Trans>
            </a>
            <a className={styles.helpLink} href={`https://grafana.com/tutorials?${UTM}`}>
              <Trans i18nKey="welcome.welcome-banner.link-tutorials">Tutorials</Trans>
            </a>
            <a className={styles.helpLink} href={`https://community.grafana.com?${UTM}`}>
              <Trans i18nKey="welcome.welcome-banner.link-community">Community</Trans>
            </a>
            <a className={styles.helpLink} href={`http://slack.grafana.com?${UTM}`}>
              <Trans i18nKey="welcome.welcome-banner.link-public-slack">Public Slack</Trans>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const heroBg = `linear-gradient(135deg, ${theme.colors.background.primary} 0%, ${theme.colors.background.canvas} 55%, ${theme.colors.emphasize(theme.colors.background.primary, 0.03)} 100%)`;

  return {
    scroll: css({
      height: '100%',
      overflow: 'auto',
      boxSizing: 'border-box',
    }),
    inner: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(3),
      padding: theme.spacing(2, 3, 3),
      minHeight: '100%',
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2, 1, 2),
        gap: theme.spacing(2),
      },
    }),
    hero: css({
      borderRadius: theme.shape.borderRadius(2),
      padding: theme.spacing(3),
      background: heroBg,
      border: `1px solid ${theme.colors.border.weak}`,
    }),
    heroTitle: css({
      margin: 0,
      fontSize: theme.typography.h2.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      lineHeight: theme.typography.h2.lineHeight,
      [theme.breakpoints.down('md')]: {
        fontSize: theme.typography.h3.fontSize,
      },
    }),
    sectionHeading: css({
      margin: 0,
      fontSize: theme.typography.h5.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    pillars: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
    }),
    pillarGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: theme.spacing(2),
      [theme.breakpoints.down('lg')]: {
        gridTemplateColumns: '1fr',
      },
    }),
    pillarCard: css({
      borderRadius: theme.shape.borderRadius(2),
      padding: theme.spacing(2),
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.weak}`,
    }),
    pillarTitle: css({
      margin: `0 0 ${theme.spacing(1)}`,
      fontSize: theme.typography.h6.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    stats: css({
      borderRadius: theme.shape.borderRadius(2),
      padding: theme.spacing(2, 3),
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.weak}`,
    }),
    statRow: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: theme.spacing(2),
      textAlign: 'center',
      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
        textAlign: 'left',
      },
    }),
    statItem: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      alignItems: 'center',
      [theme.breakpoints.down('sm')]: {
        alignItems: 'flex-start',
      },
    }),
    statValue: css({
      fontSize: theme.typography.h3.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.primary.text,
      lineHeight: 1.2,
    }),
    ctas: css({
      paddingTop: theme.spacing(0.5),
    }),
    help: css({
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      gap: theme.spacing(1, 2),
      paddingTop: theme.spacing(1),
      borderTop: `1px solid ${theme.colors.border.weak}`,
    }),
    helpText: css({
      margin: 0,
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    helpLinks: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(1, 2),
    }),
    helpLink: css({
      textDecoration: 'underline',
      color: theme.colors.text.link,
      whiteSpace: 'nowrap',
      '&:hover': {
        textDecoration: 'underline',
      },
    }),
  };
};
