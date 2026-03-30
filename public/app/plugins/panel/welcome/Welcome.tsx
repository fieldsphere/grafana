import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';

// eslint-disable-next-line @grafana/i18n/no-untranslated-strings
const marketingPillars = [
  {
    title: 'Accelerate Time to Market',
    description: 'Automatically catch issues before they escalate and push new releases to market faster.',
  },
  {
    title: 'Improve UX and Easily Optimize Performance',
    description: 'Pinpoint the root cause of slow load times with end-to-end visibility.',
  },
  {
    title: 'Reduce IT Costs',
    description: 'Reduce tool sprawl and eliminate compounding investment costs with one unified solution.',
  },
  {
    title: 'Receive Alerts for Only the Issues that Matter',
    description: 'Automatically detect unanticipated outliers, anomalies, and errors without the noise.',
  },
  {
    title: 'Detect and Defend Against Attacks',
    description: 'Understand and react to ongoing threats targeting your web and serverless applications.',
  },
];

export const WelcomeBanner = () => {
  const styles = useStyles2(getStyles);

  return (
    // eslint-disable-next-line @grafana/i18n/no-untranslated-strings
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          {/* eslint-disable-next-line @grafana/i18n/no-untranslated-strings */}
          <h1 className={styles.title}>Full-Stack Observability & Security Built for Enterprise Scale</h1>
          {/* eslint-disable-next-line @grafana/i18n/no-untranslated-strings */}
          <p className={styles.subtitle}>
            Monitor, troubleshoot, and secure your entire stack with one unified platform.
          </p>
        </div>
        <div className={styles.ctaContainer}>
          {/* eslint-disable-next-line @grafana/i18n/no-untranslated-strings */}
          <Button variant="primary" size="lg" className={styles.ctaButton}>
            Start Your Free Trial
          </Button>
          {/* eslint-disable-next-line @grafana/i18n/no-untranslated-strings */}
          <Button variant="secondary" size="lg" className={styles.ctaButton}>
            Request a Demo
          </Button>
        </div>
      </div>

      <div className={styles.pillarsGrid}>
        {marketingPillars.map((pillar, index) => (
          <div key={index} className={styles.pillarCard}>
            <h3 className={styles.pillarTitle}>{pillar.title}</h3>
            <p className={styles.pillarDesc}>{pillar.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: theme.spacing(3),
      gap: theme.spacing(4),
      overflow: 'auto',

      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
      },
    }),
    heroSection: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(3),

      [theme.breakpoints.down('lg')]: {
        flexDirection: 'column',
        alignItems: 'flex-start',
      },
    }),
    heroContent: css({
      flex: 1,
    }),
    title: css({
      marginBottom: theme.spacing(1),
      fontSize: theme.typography.h1.fontSize,
      fontWeight: theme.typography.fontWeightMedium,

      [theme.breakpoints.down('md')]: {
        fontSize: theme.typography.h2.fontSize,
      },
    }),
    subtitle: css({
      fontSize: theme.typography.h3.fontSize,
      color: theme.colors.text.secondary,
      margin: 0,
    }),
    ctaContainer: css({
      display: 'flex',
      gap: theme.spacing(2),
      flexWrap: 'wrap',
    }),
    ctaButton: css({
      whiteSpace: 'nowrap',
    }),
    pillarsGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: theme.spacing(3),
      width: '100%',
    }),
    pillarCard: css({
      padding: theme.spacing(3),
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.shape.radius.default,
      border: `1px solid ${theme.colors.border.weak}`,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    pillarTitle: css({
      margin: 0,
      fontSize: theme.typography.h4.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.primary,
    }),
    pillarDesc: css({
      margin: 0,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    }),
  };
};
