import { css, keyframes } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';

const helpOptions = [
  { label: 'Documentation', href: 'https://grafana.com/docs/grafana/latest' },
  { label: 'Tutorials', href: 'https://grafana.com/tutorials' },
  { label: 'Community', href: 'https://community.grafana.com' },
  { label: 'Public Slack', href: 'http://slack.grafana.com' },
];

const valueProps = [
  'Unified observability for metrics, logs, traces, and profiles',
  'Seamless integration with 60+ data sources',
  'Powerful alerting and incident response',
];

const features = [
  {
    icon: 'apps' as const,
    title: 'Dashboards',
    description: 'Build rich, interactive dashboards with powerful visualizations.',
    href: '/dashboards',
  },
  {
    icon: 'bell' as const,
    title: 'Alerting',
    description: 'Define alert rules and get notified before issues escalate.',
    href: '/alerting',
  },
  {
    icon: 'compass' as const,
    title: 'Explore',
    description: 'Query and drill into your data across any data source.',
    href: '/explore',
  },
  {
    icon: 'plug' as const,
    title: 'Connections',
    description: 'Connect to databases, cloud services, and more.',
    href: '/connections',
  },
];

const stats = [
  { value: '60+', label: 'Data sources' },
  { value: '1000+', label: 'Community dashboards' },
  { value: '20M+', label: 'Active installations' },
];

export const WelcomeBanner = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.root}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Welcome to Grafana</h1>
          <p className={styles.heroSubtitle}>The open observability platform</p>
          <ul className={styles.valueProps}>
            {valueProps.map((prop) => (
              <li key={prop} className={styles.valueProp}>
                <Icon name="check" className={styles.checkIcon} />
                {prop}
              </li>
            ))}
          </ul>
          <div className={styles.ctaRow}>
            <a href="/dashboard/new" className={styles.ctaPrimary}>
              Create a dashboard
            </a>
            <a href="/explore" className={styles.ctaSecondary}>
              Explore data
            </a>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className={styles.featuresGrid}>
        {features.map((f) => (
          <a key={f.title} href={f.href} className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <Icon name={f.icon} size="xl" />
            </div>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.description}</p>
          </a>
        ))}
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statItem}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Help links */}
      <div className={styles.helpRow}>
        <span className={styles.helpLabel}>Need help?</span>
        {helpOptions.map((opt) => (
          <a
            key={opt.label}
            className={styles.helpLink}
            href={`${opt.href}?utm_source=grafana_gettingstarted`}
          >
            {opt.label}
          </a>
        ))}
      </div>
    </div>
  );
};

const shimmer = keyframes({
  '0%': { backgroundPosition: '-200% 0' },
  '100%': { backgroundPosition: '200% 0' },
});

const getStyles = (theme: GrafanaTheme2) => {
  const isDark = theme.isDark;

  const heroBg = isDark
    ? 'linear-gradient(135deg, #1b0e2e 0%, #2a1445 40%, #0f1c3d 100%)'
    : 'linear-gradient(135deg, #3b1a6e 0%, #5c2d91 40%, #1a3a6e 100%)';

  const cardBg = isDark ? theme.colors.background.secondary : theme.colors.background.primary;
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

  return {
    root: css({
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'auto',
      gap: theme.spacing(2),
    }),

    /* ---- Hero ---- */
    hero: css({
      background: heroBg,
      borderRadius: theme.shape.radius.default,
      padding: theme.spacing(4, 4),
      position: 'relative',
      overflow: 'hidden',

      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 80% 20%, rgba(245,78,0,0.12) 0%, transparent 50%),' +
          'radial-gradient(circle at 20% 80%, rgba(90,50,180,0.15) 0%, transparent 50%)',
        pointerEvents: 'none',
      },

      [theme.breakpoints.down('md')]: {
        padding: theme.spacing(3, 2),
      },
    }),

    heroContent: css({
      position: 'relative',
      zIndex: 1,
      maxWidth: 680,
    }),

    heroTitle: css({
      color: '#ffffff',
      fontSize: 32,
      fontWeight: 700,
      margin: 0,
      lineHeight: 1.2,

      [theme.breakpoints.down('md')]: {
        fontSize: 24,
      },
    }),

    heroSubtitle: css({
      color: 'rgba(255,255,255,0.75)',
      fontSize: 16,
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(2),

      [theme.breakpoints.down('md')]: {
        fontSize: 14,
      },
    }),

    valueProps: css({
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(3),
    }),

    valueProp: css({
      color: 'rgba(255,255,255,0.9)',
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
    }),

    checkIcon: css({
      color: '#f54e00',
      flexShrink: 0,
    }),

    ctaRow: css({
      display: 'flex',
      gap: theme.spacing(2),
      flexWrap: 'wrap',
    }),

    ctaPrimary: css({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(1, 3),
      borderRadius: theme.shape.radius.default,
      background: 'linear-gradient(90deg, #f54e00 0%, #ff7a33 100%)',
      color: '#ffffff',
      fontWeight: 600,
      fontSize: 14,
      textDecoration: 'none',
      border: 'none',
      cursor: 'pointer',
      transition: 'opacity 0.15s ease',
      backgroundSize: '200% 100%',

      '&:hover': {
        opacity: 0.9,
        color: '#ffffff',
        animation: `${shimmer} 1.5s ease infinite`,
      },
    }),

    ctaSecondary: css({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(1, 3),
      borderRadius: theme.shape.radius.default,
      background: 'transparent',
      color: '#ffffff',
      fontWeight: 600,
      fontSize: 14,
      textDecoration: 'none',
      border: '1px solid rgba(255,255,255,0.35)',
      cursor: 'pointer',
      transition: 'background 0.15s ease, border-color 0.15s ease',

      '&:hover': {
        background: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.55)',
        color: '#ffffff',
      },
    }),

    /* ---- Feature cards ---- */
    featuresGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing(2),

      [theme.breakpoints.down('lg')]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
      },
    }),

    featureCard: css({
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: theme.shape.radius.default,
      padding: theme.spacing(2),
      textDecoration: 'none',
      color: theme.colors.text.primary,
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',

      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows.z2,
        color: theme.colors.text.primary,
      },
    }),

    featureIconWrap: css({
      width: 40,
      height: 40,
      borderRadius: theme.shape.radius.circle,
      background: isDark ? 'rgba(245,78,0,0.12)' : 'rgba(245,78,0,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#f54e00',
      marginBottom: theme.spacing(1.5),
    }),

    featureTitle: css({
      fontSize: 15,
      fontWeight: 600,
      margin: 0,
      marginBottom: theme.spacing(0.5),
    }),

    featureDesc: css({
      fontSize: 13,
      color: theme.colors.text.secondary,
      margin: 0,
      lineHeight: 1.5,
    }),

    /* ---- Stats ---- */
    statsRow: css({
      display: 'flex',
      justifyContent: 'space-around',
      gap: theme.spacing(2),
      padding: theme.spacing(2, 0),
      borderTop: `1px solid ${theme.colors.border.weak}`,
      borderBottom: `1px solid ${theme.colors.border.weak}`,

      [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        alignItems: 'center',
      },
    }),

    statItem: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(0.5),
    }),

    statValue: css({
      fontSize: 28,
      fontWeight: 700,
      color: '#f54e00',
      lineHeight: 1,

      [theme.breakpoints.down('md')]: {
        fontSize: 22,
      },
    }),

    statLabel: css({
      fontSize: 13,
      color: theme.colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }),

    /* ---- Help row ---- */
    helpRow: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(2),
      flexWrap: 'wrap',
      padding: theme.spacing(1, 0),
    }),

    helpLabel: css({
      fontSize: 14,
      fontWeight: 600,
      color: theme.colors.text.secondary,
    }),

    helpLink: css({
      fontSize: 13,
      color: theme.colors.text.link,
      textDecoration: 'underline',
      textDecorationColor: 'transparent',
      transition: 'text-decoration-color 0.15s ease',

      '&:hover': {
        textDecorationColor: 'currentColor',
      },
    }),
  };
};
