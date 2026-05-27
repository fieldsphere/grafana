import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Icon, LinkButton, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';

const helpOptions = [
  { value: 0, label: 'Documentation', href: 'https://grafana.com/docs/grafana/latest' },
  { value: 1, label: 'Tutorials', href: 'https://grafana.com/tutorials' },
  { value: 2, label: 'Community', href: 'https://community.grafana.com' },
  { value: 3, label: 'Public Slack', href: 'http://slack.grafana.com' },
];

const valueProps = [
  {
    key: 'ship',
    icon: 'rocket' as const,
    title: <Trans i18nKey="welcome.welcome-banner.card-ship-title">Ship faster</Trans>,
    body: (
      <Trans i18nKey="welcome.welcome-banner.card-ship-body">
        Catch regressions in CI and understand production impact after every deploy.
      </Trans>
    ),
  },
  {
    key: 'ux',
    icon: 'heart' as const,
    title: <Trans i18nKey="welcome.welcome-banner.card-ux-title">Improve user experience</Trans>,
    body: <Trans i18nKey="welcome.welcome-banner.card-ux-body">Trace requests end-to-end and spot bottlenecks before users do.</Trans>,
  },
  {
    key: 'cost',
    icon: 'sitemap' as const,
    title: <Trans i18nKey="welcome.welcome-banner.card-cost-title">Reduce tool sprawl</Trans>,
    body: (
      <Trans i18nKey="welcome.welcome-banner.card-cost-body">
        Metrics, logs, and traces in one place—less context switching for your team.
      </Trans>
    ),
  },
  {
    key: 'alerts',
    icon: 'bell' as const,
    title: <Trans i18nKey="welcome.welcome-banner.card-alerts-title">Alert on what matters</Trans>,
    body: (
      <Trans i18nKey="welcome.welcome-banner.card-alerts-body">
        Route signals into actionable notifications instead of noisy pages.
      </Trans>
    ),
  },
];

export const WelcomeBanner = () => {
  const styles = useStyles2(getStyles);
  const base = config.appSubUrl || '';

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="welcome-hero-heading">
        <div className={styles.heroInner}>
          <Stack direction="column" gap={2}>
            <Text element="p" variant="bodySmall" color="secondary">
              <Trans i18nKey="welcome.welcome-banner.kicker">Observability at any scale</Trans>
            </Text>
            <h1 id="welcome-hero-heading" className={styles.heroTitle}>
              <Trans i18nKey="welcome.welcome-banner.headline">
                Full-stack observability built for teams who move fast
              </Trans>
            </h1>
            <p className={styles.heroSub}>
              <Trans i18nKey="welcome.welcome-banner.subhead">
                See your metrics, logs, traces, and dashboards in one place—so you can ship with confidence.
              </Trans>
            </p>
            <ul className={styles.bullets}>
              <li className={styles.bulletItem}>
                <Icon name="check" size="sm" className={styles.bulletIcon} />
                <Trans i18nKey="welcome.welcome-banner.bullet-1">Connect data sources in minutes</Trans>
              </li>
              <li className={styles.bulletItem}>
                <Icon name="check" size="sm" className={styles.bulletIcon} />
                <Trans i18nKey="welcome.welcome-banner.bullet-2">Minimal maintenance, maximum clarity</Trans>
              </li>
              <li className={styles.bulletItem}>
                <Icon name="check" size="sm" className={styles.bulletIcon} />
                <Trans i18nKey="welcome.welcome-banner.bullet-3">Broad coverage across your stack</Trans>
              </li>
            </ul>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} wrap="wrap">
              <LinkButton
                href={`${base}/connections/add-new-connection`}
                variant="primary"
                icon="plug"
                size="lg"
              >
                <Trans i18nKey="welcome.welcome-banner.cta-connect">Connect your data</Trans>
              </LinkButton>
              <LinkButton href={`${base}/explore`} variant="secondary" icon="compass" size="lg" fill="outline">
                <Trans i18nKey="welcome.welcome-banner.cta-explore">Open Explore</Trans>
              </LinkButton>
              <LinkButton
                href="https://grafana.com/docs/grafana/latest/"
                variant="secondary"
                icon="external-link-alt"
                size="lg"
                fill="outline"
                target="_blank"
                rel="noreferrer"
              >
                <Trans i18nKey="welcome.welcome-banner.cta-docs">Read the docs</Trans>
              </LinkButton>
            </Stack>
          </Stack>
        </div>
      </section>

      <section className={styles.cardsSection} aria-labelledby="welcome-value-heading">
        <h2 id="welcome-value-heading" className={styles.sectionTitle}>
          <Trans i18nKey="welcome.welcome-banner.section-value-title">Why teams choose Grafana</Trans>
        </h2>
        <div className={styles.cardGrid}>
          {valueProps.map((card) => (
            <div key={card.key} className={styles.valueCard}>
              <div className={styles.cardIconWrap}>
                <Icon name={card.icon} size="xl" />
              </div>
              <Text element="h3" variant="h5">
                {card.title}
              </Text>
              <Text element="p" variant="bodySmall" color="secondary">
                {card.body}
              </Text>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.helpRow}>
        <Text element="span" variant="body" weight="medium">
          <Trans i18nKey="welcome.welcome-banner.need-help">Need help?</Trans>
        </Text>
        <div className={styles.helpLinks}>
          {helpOptions.map((option, index) => (
            <TextLink
              key={`${option.label}-${index}`}
              href={`${option.href}?utm_source=grafana_gettingstarted`}
              external
              inline={false}
            >
              {option.label}
            </TextLink>
          ))}
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const isDark = theme.isDark;
  const heroBg = isDark
    ? `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.canvas} 45%, rgba(255, 106, 0, 0.12) 100%)`
    : `linear-gradient(135deg, ${theme.colors.background.primary} 0%, ${theme.colors.background.secondary} 50%, rgba(255, 106, 0, 0.08) 100%)`;
  const cardBorder = isDark ? theme.colors.border.weak : theme.colors.border.medium;

  return {
    page: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(3),
      minHeight: '100%',
    }),
    hero: css({
      borderRadius: theme.shape.radius.default,
      background: heroBg,
      border: `1px solid ${theme.colors.border.weak}`,
      boxShadow: isDark ? theme.shadows.z1 : theme.shadows.z2,
      overflow: 'hidden',
    }),
    heroInner: css({
      padding: theme.spacing(3, 4),
      [theme.breakpoints.down('md')]: {
        padding: theme.spacing(2, 2),
      },
    }),
    heroTitle: css({
      margin: 0,
      fontSize: theme.typography.pxToRem(28),
      lineHeight: 1.2,
      fontWeight: theme.typography.fontWeightMedium,
      letterSpacing: '-0.02em',
      color: theme.colors.text.primary,
      maxWidth: '42rem',
      [theme.breakpoints.down('sm')]: {
        fontSize: theme.typography.pxToRem(22),
      },
    }),
    heroSub: css({
      margin: 0,
      fontSize: theme.typography.body.fontSize,
      lineHeight: 1.5,
      color: theme.colors.text.secondary,
      maxWidth: '40rem',
    }),
    bullets: css({
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      color: theme.colors.text.primary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    bulletItem: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
    }),
    bulletIcon: css({
      color: theme.colors.primary.text,
      flexShrink: 0,
    }),
    cardsSection: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
    }),
    sectionTitle: css({
      margin: 0,
      fontSize: theme.typography.h4.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.primary,
    }),
    cardGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: theme.spacing(2),
      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
      },
    }),
    valueCard: css({
      borderRadius: theme.shape.radius.default,
      border: `1px solid ${cardBorder}`,
      background: theme.colors.background.primary,
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      minHeight: theme.spacing(14),
    }),
    cardIconWrap: css({
      color: theme.colors.primary.text,
      lineHeight: 0,
    }),
    helpRow: css({
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      gap: theme.spacing(2),
      paddingTop: theme.spacing(1),
      borderTop: `1px solid ${theme.colors.border.weak}`,
    }),
    helpLinks: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(2),
    }),
  };
};
