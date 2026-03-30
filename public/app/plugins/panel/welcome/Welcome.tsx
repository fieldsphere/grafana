import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { useStyles2 } from '@grafana/ui';

const helpOptions = [
  { value: 0, label: 'Documentation', href: 'https://grafana.com/docs/grafana/latest' },
  { value: 1, label: 'Tutorials', href: 'https://grafana.com/tutorials' },
  { value: 2, label: 'Community', href: 'https://community.grafana.com' },
  { value: 3, label: 'Public Slack', href: 'http://slack.grafana.com' },
];

const actionOptions = [
  { label: 'Explore dashboards', href: '/dashboards' },
  { label: 'Connect data sources', href: '/connections/datasources' },
];

const valuePoints = ['Faster issue detection', 'Clear service health context', 'Lower monitoring toil'];

export const WelcomeBanner = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>
          <Trans i18nKey="welcome.welcome-banner.grafana-observability">Grafana observability</Trans>
        </p>
        <h1 className={styles.title}>
          <Trans i18nKey="welcome.welcome-banner.welcome-to-grafana">See issues sooner and ship with confidence</Trans>
        </h1>
        <p className={styles.subtitle}>
          <Trans i18nKey="welcome.welcome-banner.subtitle">
            Monitor metrics, logs, traces, and profiles in one place so your team can respond faster.
          </Trans>
        </p>
        <div className={styles.actions}>
          {actionOptions.map((option, index) => {
            return (
              <a key={`${option.label}-${index}`} className={styles.actionLink} href={option.href}>
                {option.label}
              </a>
            );
          })}
        </div>
        <ul className={styles.valueList}>
          {valuePoints.map((point) => (
            <li key={point} className={styles.valueListItem}>
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.help}>
        <h3 className={styles.helpText}>
          <Trans i18nKey="welcome.welcome-banner.need-help">Need help?</Trans>
        </h3>
        <div className={styles.helpLinks}>
          {helpOptions.map((option, index) => {
            return (
              <a
                key={`${option.label}-${index}`}
                className={styles.helpLink}
                href={`${option.href}?utm_source=grafana_gettingstarted`}
              >
                {option.label}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      display: 'flex',
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.medium}`,
      borderRadius: theme.shape.radius.default,
      height: '100%',
      alignItems: 'stretch',
      justifyContent: 'space-between',
      padding: theme.spacing(2, 3),
      gap: theme.spacing(2),

      [theme.breakpoints.down('lg')]: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      },

      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
      },
    }),
    hero: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: theme.spacing(1),
      width: '100%',
      maxWidth: 760,
    }),
    eyebrow: css({
      margin: 0,
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontWeight: theme.typography.fontWeightMedium,
    }),
    title: css({
      margin: 0,
      fontSize: theme.typography.h1.fontSize,
      lineHeight: theme.typography.h1.lineHeight,

      [theme.breakpoints.down('lg')]: {
        fontSize: theme.typography.h2.fontSize,
        lineHeight: theme.typography.h2.lineHeight,
      },

      [theme.breakpoints.down('md')]: {
        fontSize: theme.typography.h3.fontSize,
        lineHeight: theme.typography.h3.lineHeight,
      },
    }),
    subtitle: css({
      margin: 0,
      color: theme.colors.text.secondary,
      maxWidth: 700,
      fontSize: theme.typography.h6.fontSize,
      lineHeight: theme.typography.h6.lineHeight,
    }),
    actions: css({
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
      marginTop: theme.spacing(1),
    }),
    actionLink: css({
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: theme.shape.radius.default,
      border: `1px solid ${theme.colors.border.strong}`,
      padding: theme.spacing(0.75, 1.5),
      fontWeight: theme.typography.fontWeightMedium,
      textDecoration: 'none',
      color: theme.colors.text.primary,
      background: theme.colors.background.primary,
      ':hover': {
        background: theme.colors.background.canvas,
      },
    }),
    valueList: css({
      margin: theme.spacing(1, 0, 0, 0),
      padding: 0,
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(0.75, 1.5),
      listStyle: 'none',
    }),
    valueListItem: css({
      margin: 0,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: theme.typography.bodySmall.lineHeight,
      ':before': {
        content: '"•"',
        marginRight: theme.spacing(0.5),
        color: theme.colors.primary.main,
      },
    }),
    help: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: theme.spacing(0.5),
      paddingLeft: theme.spacing(2),
      borderLeft: `1px solid ${theme.colors.border.medium}`,
      minWidth: 260,

      [theme.breakpoints.down('lg')]: {
        minWidth: 'auto',
        width: '100%',
        borderLeft: 0,
        borderTop: `1px solid ${theme.colors.border.medium}`,
        paddingLeft: 0,
        paddingTop: theme.spacing(1),
      },
    }),
    helpText: css({
      margin: 0,

      [theme.breakpoints.down('md')]: {
        fontSize: theme.typography.h6.fontSize,
      },
    }),
    helpLinks: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(0.5, 1),
    }),
    helpLink: css({
      textDecoration: 'underline',
      textWrap: 'nowrap',
      color: theme.colors.text.link,
    }),
  };
};
