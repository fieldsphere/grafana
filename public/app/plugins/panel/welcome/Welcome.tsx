import { css } from '@emotion/css';

import { GrafanaTheme2, locationUtil } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { LinkButton, Stack, Text, useStyles2 } from '@grafana/ui';

const UTM = 'utm_source=grafana_gettingstarted';

const helpOptions = [
  { value: 0, labelKey: 'welcome.welcome-banner.link-documentation', defaultLabel: 'Documentation', href: 'https://grafana.com/docs/grafana/latest' },
  { value: 1, labelKey: 'welcome.welcome-banner.link-tutorials', defaultLabel: 'Tutorials', href: 'https://grafana.com/tutorials' },
  { value: 2, labelKey: 'welcome.welcome-banner.link-community', defaultLabel: 'Community', href: 'https://community.grafana.com' },
  { value: 3, labelKey: 'welcome.welcome-banner.link-public-slack', defaultLabel: 'Public Slack', href: 'http://slack.grafana.com' },
] as const;

const pillars = [
  {
    titleKey: 'welcome.welcome-banner.pillar-visualize-title',
    titleDefault: 'Visualize and alert',
    bodyKey: 'welcome.welcome-banner.pillar-visualize-body',
    bodyDefault: 'Build dashboards and alert on metrics, logs, traces, and profiles in one place.',
  },
  {
    titleKey: 'welcome.welcome-banner.pillar-unify-title',
    titleDefault: 'Unify your data',
    bodyKey: 'welcome.welcome-banner.pillar-unify-body',
    bodyDefault: 'Connect 100+ data sources and query without switching tools.',
  },
  {
    titleKey: 'welcome.welcome-banner.pillar-collaborate-title',
    titleDefault: 'Collaborate',
    bodyKey: 'welcome.welcome-banner.pillar-collaborate-body',
    bodyDefault: 'Share dashboards and foster a data-driven culture with your team.',
  },
] as const;

const stats = [
  {
    valueKey: 'welcome.welcome-banner.stat-sources-value',
    valueDefault: '100+',
    labelKey: 'welcome.welcome-banner.stat-sources-label',
    labelDefault: 'Data sources',
  },
  {
    valueKey: 'welcome.welcome-banner.stat-viz-value',
    valueDefault: 'Many',
    labelKey: 'welcome.welcome-banner.stat-viz-label',
    labelDefault: 'Visualization types',
  },
  {
    valueKey: 'welcome.welcome-banner.stat-oss-value',
    valueDefault: 'Open source',
    labelKey: 'welcome.welcome-banner.stat-oss-label',
    labelDefault: 'Core platform',
  },
] as const;

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
            {pillars.map((pillar) => (
              <div key={pillar.titleKey} className={styles.pillarCard}>
                <h3 className={styles.pillarTitle}>
                  <Trans i18nKey={pillar.titleKey}>{pillar.titleDefault}</Trans>
                </h3>
                <Text element="p" variant="bodySmall" color="secondary">
                  <Trans i18nKey={pillar.bodyKey}>{pillar.bodyDefault}</Trans>
                </Text>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.stats} aria-labelledby="welcome-stats-heading">
          <h2 id="welcome-stats-heading" className={styles.visuallyHidden}>
            <Trans i18nKey="welcome.welcome-banner.stats-heading">At a glance</Trans>
          </h2>
          <div className={styles.statRow}>
            {stats.map((stat) => (
              <div key={stat.valueKey} className={styles.statItem}>
                <div className={styles.statValue}>
                  <Trans i18nKey={stat.valueKey}>{stat.valueDefault}</Trans>
                </div>
                <Text variant="bodySmall" color="secondary">
                  <Trans i18nKey={stat.labelKey}>{stat.labelDefault}</Trans>
                </Text>
              </div>
            ))}
          </div>
        </section>

        <section
          className={styles.ctas}
          aria-label={t('welcome.welcome-banner.cta-section-aria', 'Get started')}
        >
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
            {helpOptions.map((option, index) => (
              <a
                key={`${option.labelKey}-${index}`}
                className={styles.helpLink}
                href={`${option.href}?${UTM}`}
              >
                <Trans i18nKey={option.labelKey}>{option.defaultLabel}</Trans>
              </a>
            ))}
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
    visuallyHidden: css({
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0,
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
