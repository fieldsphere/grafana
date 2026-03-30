import { css } from '@emotion/css';

import { GrafanaTheme2, type IconName } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { Icon, LinkButton, TextLink, useStyles2 } from '@grafana/ui';

const quickActions = [
  { label: 'Launch dashboards', href: '/dashboards' },
  { label: 'Connect data', href: '/datasources/new' },
];

const capabilityCards: Array<{ title: string; description: string; icon: IconName }> = [
  {
    title: 'Unify every signal',
    description: 'Correlate metrics, logs, traces, and profiles from one Grafana workspace.',
    icon: 'database',
  },
  {
    title: 'Move from issue to root cause',
    description:
      'Open dashboards, inspect incidents, and jump into troubleshooting workflows with less context switching.',
    icon: 'apps',
  },
  {
    title: 'Scale with your team',
    description: 'Share dashboards, standardize views, and onboard new teammates with repeatable paths.',
    icon: 'users-alt',
  },
];

const helpOptions = [
  { label: 'Documentation', href: 'https://grafana.com/docs/grafana/latest' },
  { label: 'Tutorials', href: 'https://grafana.com/tutorials' },
  { label: 'Community', href: 'https://community.grafana.com' },
  { label: 'Public Slack', href: 'http://slack.grafana.com' },
];

export const WelcomeBanner = () => {
  const styles = useStyles2(getStyles);

  return (
    <section className={styles.container} aria-labelledby="grafana-home-hero-title">
      <div className={styles.heroSurface}>
        <div className={styles.copyColumn}>
          <div className={styles.eyebrow}>
            <Trans i18nKey="welcome.welcome-banner.home-label">Grafana home</Trans>
          </div>
          <h1 id="grafana-home-hero-title" className={styles.title}>
            <Trans i18nKey="welcome.welcome-banner.welcome-to-grafana">Welcome to Grafana</Trans>
          </h1>
          <p className={styles.summary}>
            <Trans i18nKey="welcome.welcome-banner.summary">
              Bring telemetry, dashboards, and investigation workflows together so your team can move from signal to
              action faster.
            </Trans>
          </p>
          <div className={styles.actionRow}>
            {quickActions.map((action) => (
              <LinkButton key={action.href} href={action.href} variant="primary">
                {action.label}
              </LinkButton>
            ))}
            <LinkButton
              href="https://grafana.com/tutorials?utm_source=grafana_home"
              variant="secondary"
              fill="outline"
              target="_blank"
              rel="noreferrer"
            >
              <Trans i18nKey="welcome.welcome-banner.explore-tutorials">Explore tutorials</Trans>
            </LinkButton>
          </div>
        </div>

        <div className={styles.cardGrid}>
          {capabilityCards.map((card) => (
            <article key={card.title} className={styles.capabilityCard}>
              <div className={styles.cardIcon}>
                <Icon name={card.icon} size="lg" />
              </div>
              <h2 className={styles.cardTitle}>{card.title}</h2>
              <p className={styles.cardDescription}>{card.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.helpRow}>
        <span className={styles.helpLabel}>
          <Trans i18nKey="welcome.welcome-banner.need-help">Need help?</Trans>
        </span>
        <div className={styles.helpLinks}>
          {helpOptions.map((option) => (
            <TextLink
              key={option.label}
              className={styles.helpLink}
              href={`${option.href}?utm_source=grafana_home`}
              external
            >
              {option.label}
            </TextLink>
          ))}
        </div>
      </div>
    </section>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      height: '100%',
      padding: theme.spacing(2),
      background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.canvas} 55%, ${theme.colors.background.primary} 100%)`,

      [theme.breakpoints.up('md')]: {
        padding: theme.spacing(3),
        gap: theme.spacing(3),
      },
    }),
    heroSurface: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
      gap: theme.spacing(2),
      padding: theme.spacing(3),
      flex: 1,
      borderRadius: theme.shape.radius.lg,
      border: `1px solid ${theme.colors.border.weak}`,
      background: `linear-gradient(180deg, ${theme.colors.background.primary} 0%, ${theme.colors.background.secondary} 100%)`,
      boxShadow: theme.shadows.z2,

      [theme.breakpoints.down('lg')]: {
        gridTemplateColumns: '1fr',
      },

      [theme.breakpoints.up('md')]: {
        padding: theme.spacing(4),
        gap: theme.spacing(3),
      },
    }),
    copyColumn: css({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: theme.spacing(2),
    }),
    eyebrow: css({
      display: 'inline-flex',
      width: 'fit-content',
      padding: theme.spacing(0.5, 1.25),
      borderRadius: theme.shape.radius.pill,
      background: theme.colors.primary.transparent,
      color: theme.colors.primary.text,
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    }),
    title: css({
      margin: 0,
      maxWidth: '12ch',
      fontSize: theme.typography.h1.fontSize,
      lineHeight: theme.typography.h1.lineHeight,

      [theme.breakpoints.down('md')]: {
        maxWidth: 'none',
        fontSize: theme.typography.h2.fontSize,
        lineHeight: theme.typography.h2.lineHeight,
      },
    }),
    summary: css({
      margin: 0,
      maxWidth: '56ch',
      color: theme.colors.text.secondary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: 1.6,
    }),
    actionRow: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(1.5),
      alignItems: 'center',
    }),
    cardGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: theme.spacing(2),
      alignSelf: 'stretch',

      [theme.breakpoints.down('lg')]: {
        gridTemplateColumns: '1fr',
      },
    }),
    capabilityCard: css({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: theme.spacing(1.5),
      minHeight: 0,
      padding: theme.spacing(2),
      borderRadius: theme.shape.radius.md,
      background: theme.colors.background.canvas,
      border: `1px solid ${theme.colors.border.weak}`,
    }),
    cardIcon: css({
      display: 'inline-flex',
      width: theme.spacing(4),
      height: theme.spacing(4),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.shape.radius.md,
      background: theme.colors.background.secondary,
      color: theme.colors.primary.text,
    }),
    cardTitle: css({
      margin: 0,
      fontSize: theme.typography.h5.fontSize,
      lineHeight: theme.typography.h5.lineHeight,
    }),
    cardDescription: css({
      margin: 0,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: 1.6,
    }),
    helpRow: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(1, 2),
      alignItems: 'center',
      paddingLeft: theme.spacing(1),
    }),
    helpLabel: css({
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    helpLinks: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(1.5),
    }),
    helpLink: css({
      textWrap: 'nowrap',
    }),
  };
};
