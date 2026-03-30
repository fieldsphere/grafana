import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, LinkButton, useStyles2 } from '@grafana/ui';

export const WelcomeBanner = () => {
  const styles = useStyles2(getStyles);

  const marketingPillars = [
    {
      title: t('welcome.marketing.pillar1-title', 'Accelerate Time to Market'),
      description: t('welcome.marketing.pillar1-desc', 'Automatically catch issues before they escalate and push new releases to market faster.'),
    },
    {
      title: t('welcome.marketing.pillar2-title', 'Improve UX and Easily Optimize Performance'),
      description: t('welcome.marketing.pillar2-desc', 'Pinpoint the root cause of slow load times with end-to-end visibility.'),
    },
    {
      title: t('welcome.marketing.pillar3-title', 'Reduce IT Costs'),
      description: t('welcome.marketing.pillar3-desc', 'Reduce tool sprawl and eliminate compounding investment costs with one unified solution.'),
    },
    {
      title: t('welcome.marketing.pillar4-title', 'Receive Alerts for Only the Issues that Matter'),
      description: t('welcome.marketing.pillar4-desc', 'Automatically detect unanticipated outliers, anomalies, and errors without the noise.'),
    },
    {
      title: t('welcome.marketing.pillar5-title', 'Detect and Defend Against Attacks'),
      description: t('welcome.marketing.pillar5-desc', 'Understand and react to ongoing threats targeting your web and serverless applications.'),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            <Trans i18nKey="welcome.marketing.hero-title">Full-Stack Observability & Security Built for Enterprise Scale</Trans>
          </h1>
          <p className={styles.subtitle}>
            <Trans i18nKey="welcome.marketing.hero-subtitle">Monitor, troubleshoot, and secure your entire stack with one unified platform.</Trans>
          </p>
        </div>
        <div className={styles.ctaContainer}>
          <LinkButton href="https://grafana.com/" target="_blank" variant="primary" size="lg" className={styles.ctaButton}>
            <Trans i18nKey="welcome.marketing.cta-free-trial">Start Your Free Trial</Trans>
          </LinkButton>
          <LinkButton href="https://grafana.com/contact/" target="_blank" variant="secondary" size="lg" className={styles.ctaButton}>
            <Trans i18nKey="welcome.marketing.cta-demo">Request a Demo</Trans>
          </LinkButton>
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
