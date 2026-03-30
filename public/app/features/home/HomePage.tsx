import { css, cx, keyframes } from '@emotion/css';
import { useEffect, useState } from 'react';

import { GrafanaTheme2, locationUtil } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getBackendSrv, locationService } from '@grafana/runtime';
import { Icon, IconName, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import PageLoader from 'app/core/components/PageLoader/PageLoader';
import { DashboardDTO, HomeDashboardRedirectDTO, isRedirectResponse } from 'app/types/dashboard';

interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
  href: string;
  accentColor: string;
}

function FeatureCard({ icon, title, description, href, accentColor }: FeatureCardProps) {
  const styles = useStyles2(getFeatureCardStyles);
  const accentCls = css({ '--accent': accentColor });

  return (
    <a href={href} className={cx(styles.card, accentCls)}>
      <div className={styles.iconWrap}>
        <Icon name={icon} size="xl" />
      </div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDesc}>{description}</p>
      <span className={styles.cardLink}>
        <Trans i18nKey="home.feature-card.get-started">Get started</Trans> <Icon name="arrow-right" size="md" />
      </span>
    </a>
  );
}

export default function HomePage() {
  const styles = useStyles2(getStyles);
  const [isCheckingHomeRedirect, setIsCheckingHomeRedirect] = useState(true);

  useEffect(() => {
    const checkHomeDashboardRedirect = async () => {
      try {
        const response = await getBackendSrv().get<DashboardDTO | HomeDashboardRedirectDTO>('/api/dashboards/home');

        if (isRedirectResponse(response)) {
          const newUrl = locationUtil.processRedirectUri(response.redirectUri, locationService.getLocation());
          locationService.replace(newUrl);
          return;
        }
      } catch {
        // Keep rendering the static homepage when redirect checks fail.
      }

      setIsCheckingHomeRedirect(false);
    };

    void checkHomeDashboardRedirect();
  }, []);

  if (isCheckingHomeRedirect) {
    return (
      <Page navId="home">
        <Page.Contents>
          <PageLoader />
        </Page.Contents>
      </Page>
    );
  }

  return (
    <Page navId="home">
      <Page.Contents>
        <div className={styles.root}>
          {/* Hero Section */}
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <div className={styles.badge}>
                <Trans i18nKey="home.hero.badge">Grafana Open Source</Trans>
              </div>
              <h1 className={styles.heroTitle}>
                <Trans i18nKey="home.hero.title">Observability &amp; Monitoring</Trans>
                <br />
                <span className={styles.heroAccent}>
                  <Trans i18nKey="home.hero.title-accent">Built for Scale</Trans>
                </span>
              </h1>
              <p className={styles.heroSubtitle}>
                <Trans i18nKey="home.hero.subtitle">
                  See inside any stack, any app, at any scale. Dashboards, alerting, and visualization for every metric
                  and log in your infrastructure.
                </Trans>
              </p>
              <div className={styles.heroCtas}>
                <a href="/dashboard/new" className={styles.primaryCta}>
                  <Trans i18nKey="home.hero.create-dashboard">Create Dashboard</Trans>
                </a>
                <a href="/connections/datasources/new" className={styles.secondaryCta}>
                  <Trans i18nKey="home.hero.add-data-source">Add Data Source</Trans>
                </a>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.glowOrb} />
              <div className={styles.gridPattern} />
            </div>
          </section>

          {/* Feature Highlights Section */}
          <section className={styles.featureHighlightsSection}>
            <FeatureHighlightCard
              title={t('home.stats.dashboards.value', 'Dashboards')}
              description={t('home.stats.dashboards.label', 'Visualize metrics, logs, and traces')}
            />
            <FeatureHighlightCard
              title={t('home.stats.alerting.value', 'Alerting')}
              description={t('home.stats.alerting.label', 'Detect issues and route notifications')}
            />
            <FeatureHighlightCard
              title={t('home.stats.explore.value', 'Explore')}
              description={t('home.stats.explore.label', 'Investigate and correlate signals')}
            />
            <FeatureHighlightCard
              title={t('home.stats.plugins.value', 'Plugins')}
              description={t('home.stats.plugins.label', 'Extend Grafana with integrations')}
            />
          </section>

          {/* Feature Grid */}
          <section className={styles.featureSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Trans i18nKey="home.features.title">Everything You Need to Monitor</Trans>
              </h2>
              <p className={styles.sectionSubtitle}>
                <Trans i18nKey="home.features.subtitle">
                  From infrastructure to applications, get complete visibility with powerful, flexible tools.
                </Trans>
              </p>
            </div>
            <div className={styles.featureGrid}>
              <FeatureCard
                icon="apps"
                title={t('home.features.dashboards.title', 'Dashboards')}
                description={t(
                  'home.features.dashboards.description',
                  'Build beautiful, dynamic dashboards with a powerful visual editor. Drag-and-drop panels, template variables, and real-time streaming.'
                )}
                href="/dashboards"
                accentColor="#FF6600"
              />
              <FeatureCard
                icon="bell"
                title={t('home.features.alerting.title', 'Alerting')}
                description={t(
                  'home.features.alerting.description',
                  'Set up smart alerts with multi-dimensional rules, silences, and routing. Get notified through Slack, PagerDuty, email, and more.'
                )}
                href="/alerting"
                accentColor="#6C63FF"
              />
              <FeatureCard
                icon="compass"
                title={t('home.features.explore.title', 'Explore')}
                description={t(
                  'home.features.explore.description',
                  'Ad-hoc query and investigation across all your data sources. Split view, query history, and seamless correlation of metrics and logs.'
                )}
                href="/explore"
                accentColor="#00C9A7"
              />
              <FeatureCard
                icon="database"
                title={t('home.features.data-sources.title', 'Data Sources')}
                description={t(
                  'home.features.data-sources.description',
                  'Connect to Prometheus, Loki, Elasticsearch, InfluxDB, PostgreSQL, and 500+ other data sources with native query editors.'
                )}
                href="/connections/datasources"
                accentColor="#F5C542"
              />
              <FeatureCard
                icon="plug"
                title={t('home.features.plugins.title', 'Plugins')}
                description={t(
                  'home.features.plugins.description',
                  'Extend Grafana with panels, data sources, and full app plugins from the community or build your own with the plugin SDK.'
                )}
                href="/plugins"
                accentColor="#E74C80"
              />
              <FeatureCard
                icon="shield"
                title={t('home.features.infrastructure.title', 'Infrastructure')}
                description={t(
                  'home.features.infrastructure.description',
                  'Monitor Kubernetes, Docker, cloud providers, and bare metal. Auto-discover services, track resources, and optimize performance.'
                )}
                href="/connections/infrastructure"
                accentColor="#29B6F6"
              />
            </div>
          </section>

          {/* Capabilities Section */}
          <section className={styles.capSection}>
            <div className={styles.capCard}>
              <div className={styles.capIcon}>
                <Icon name="graph-bar" size="xxxl" />
              </div>
              <div className={styles.capContent}>
                <h3 className={styles.capTitle}>
                  <Trans i18nKey="home.capabilities.troubleshooting.title">Accelerate Troubleshooting</Trans>
                </h3>
                <ul className={styles.capList}>
                  <li>
                    <Trans i18nKey="home.capabilities.troubleshooting.item1">
                      Automatically catch issues before they escalate with intelligent alerting
                    </Trans>
                  </li>
                  <li>
                    <Trans i18nKey="home.capabilities.troubleshooting.item2">
                      Rapidly identify bottlenecks, errors, and slow-running queries
                    </Trans>
                  </li>
                  <li>
                    <Trans i18nKey="home.capabilities.troubleshooting.item3">
                      Correlate metrics, logs, and traces in a single view
                    </Trans>
                  </li>
                  <li>
                    <Trans i18nKey="home.capabilities.troubleshooting.item4">
                      Push new releases with confidence using deployment markers
                    </Trans>
                  </li>
                </ul>
              </div>
            </div>
            <div className={styles.capCard}>
              <div className={styles.capIcon}>
                <Icon name="eye" size="xxxl" />
              </div>
              <div className={styles.capContent}>
                <h3 className={styles.capTitle}>
                  <Trans i18nKey="home.capabilities.visibility.title">Complete Visibility</Trans>
                </h3>
                <ul className={styles.capList}>
                  <li>
                    <Trans i18nKey="home.capabilities.visibility.item1">
                      Unified view across all your data sources and platforms
                    </Trans>
                  </li>
                  <li>
                    <Trans i18nKey="home.capabilities.visibility.item2">
                      Monitor infrastructure, applications, and business metrics
                    </Trans>
                  </li>
                  <li>
                    <Trans i18nKey="home.capabilities.visibility.item3">
                      Custom dashboards tailored to every team and use case
                    </Trans>
                  </li>
                  <li>
                    <Trans i18nKey="home.capabilities.visibility.item4">
                      Role-based access and team-level permissions
                    </Trans>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className={styles.bottomCta}>
            <h2 className={styles.bottomCtaTitle}>
              <Trans i18nKey="home.cta.title">Start monitoring in minutes</Trans>
            </h2>
            <p className={styles.bottomCtaDesc}>
              <Trans i18nKey="home.cta.subtitle">Connect your first data source and build your first dashboard.</Trans>
            </p>
            <div className={styles.heroCtas}>
              <a href="/connections/datasources/new" className={styles.primaryCta}>
                <Trans i18nKey="home.cta.connect-data-source">Connect Data Source</Trans>
              </a>
              <a href="/dashboards" className={styles.secondaryCta}>
                <Trans i18nKey="home.cta.browse-dashboards">Browse Dashboards</Trans>
              </a>
            </div>
          </section>
        </div>
      </Page.Contents>
    </Page>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const getStyles = (theme: GrafanaTheme2) => ({
  root: css({
    maxWidth: 1200,
    margin: '0 auto',
    padding: theme.spacing(0, 2),
    [theme.transitions.handleMotion('no-preference')]: {
      animation: `${fadeIn} 0.5s ease-out`,
    },
  }),

  // Hero
  hero: css({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 400,
    padding: theme.spacing(6, 0),
    overflow: 'hidden',
  }),
  heroContent: css({
    position: 'relative',
    zIndex: 1,
    maxWidth: 640,
  }),
  badge: css({
    display: 'inline-block',
    padding: theme.spacing(0.5, 1.5),
    borderRadius: theme.shape.radius.pill,
    background: theme.colors.primary.transparent,
    color: theme.colors.primary.text,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.colors.primary.border}`,
  }),
  heroTitle: css({
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    color: theme.colors.text.primary,
    margin: 0,
    marginBottom: theme.spacing(2),
  }),
  heroAccent: css({
    background: `linear-gradient(135deg, ${theme.colors.primary.main}, #FF6600)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }),
  heroSubtitle: css({
    fontSize: theme.typography.h5.fontSize,
    color: theme.colors.text.secondary,
    lineHeight: 1.6,
    maxWidth: 520,
    margin: 0,
    marginBottom: theme.spacing(4),
  }),
  heroCtas: css({
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  }),
  primaryCta: css({
    display: 'inline-flex',
    alignItems: 'center',
    padding: theme.spacing(1.5, 3),
    borderRadius: theme.shape.radius.default,
    background: `linear-gradient(135deg, ${theme.colors.primary.main}, #FF6600)`,
    color: '#fff',
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    [theme.transitions.handleMotion('no-preference')]: {
      transition: theme.transitions.create(['transform', 'box-shadow'], {
        duration: theme.transitions.duration.short,
      }),
    },
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 20px ${theme.colors.primary.transparent}`,
      color: '#fff',
    },
  }),
  secondaryCta: css({
    display: 'inline-flex',
    alignItems: 'center',
    padding: theme.spacing(1.5, 3),
    borderRadius: theme.shape.radius.default,
    background: 'transparent',
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
    textDecoration: 'none',
    border: `1px solid ${theme.colors.border.medium}`,
    cursor: 'pointer',
    [theme.transitions.handleMotion('no-preference')]: {
      transition: theme.transitions.create(['border-color', 'background', 'color'], {
        duration: theme.transitions.duration.short,
      }),
    },
    '&:hover': {
      borderColor: theme.colors.primary.border,
      background: theme.colors.primary.transparent,
      color: theme.colors.primary.text,
    },
  }),
  heroVisual: css({
    position: 'absolute',
    right: -40,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 500,
    height: 400,
    pointerEvents: 'none',
  }),
  glowOrb: css({
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: theme.shape.radius.circle,
    background: `radial-gradient(circle, ${theme.colors.primary.transparent} 0%, transparent 70%)`,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    [theme.transitions.handleMotion('no-preference')]: {
      animation: `${pulse} 4s ease-in-out infinite`,
    },
    opacity: 0.5,
  }),
  gridPattern: css({
    position: 'absolute',
    inset: 0,
    backgroundImage: `linear-gradient(${theme.colors.border.weak} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.border.weak} 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
    opacity: 0.3,
    maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
  }),

  // Feature highlights
  featureHighlightsSection: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: theme.spacing(3),
    padding: theme.spacing(4, 0),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    marginBottom: theme.spacing(6),
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  }),

  // Feature Section
  featureSection: css({
    padding: theme.spacing(4, 0),
    marginBottom: theme.spacing(6),
  }),
  sectionHeader: css({
    textAlign: 'center',
    marginBottom: theme.spacing(5),
  }),
  sectionTitle: css({
    fontSize: 32,
    fontWeight: 700,
    color: theme.colors.text.primary,
    margin: 0,
    marginBottom: theme.spacing(1),
  }),
  sectionSubtitle: css({
    fontSize: theme.typography.h5.fontSize,
    color: theme.colors.text.secondary,
    margin: 0,
    maxWidth: 560,
    marginLeft: 'auto',
    marginRight: 'auto',
  }),
  featureGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing(3),
    [theme.breakpoints.down('lg')]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
    },
  }),

  // Capabilities Section
  capSection: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing(3),
    marginBottom: theme.spacing(6),
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: '1fr',
    },
  }),
  capCard: css({
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(4),
    border: `1px solid ${theme.colors.border.weak}`,
    [theme.transitions.handleMotion('no-preference')]: {
      transition: theme.transitions.create(['border-color'], {
        duration: theme.transitions.duration.short,
      }),
    },
    '&:hover': {
      borderColor: theme.colors.border.medium,
    },
  }),
  capIcon: css({
    color: theme.colors.primary.text,
    marginBottom: theme.spacing(2),
  }),
  capContent: css({}),
  capTitle: css({
    fontSize: theme.typography.h4.fontSize,
    fontWeight: 600,
    color: theme.colors.text.primary,
    margin: 0,
    marginBottom: theme.spacing(2),
  }),
  capList: css({
    listStyle: 'none',
    padding: 0,
    margin: 0,
    '& li': {
      position: 'relative',
      paddingLeft: theme.spacing(3),
      marginBottom: theme.spacing(1.5),
      color: theme.colors.text.secondary,
      fontSize: theme.typography.body.fontSize,
      lineHeight: 1.5,
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 8,
        width: 6,
        height: 6,
        borderRadius: theme.shape.radius.circle,
        background: theme.colors.primary.main,
      },
    },
  }),

  // Bottom CTA
  bottomCta: css({
    textAlign: 'center',
    padding: theme.spacing(6, 0),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    marginBottom: theme.spacing(4),
  }),
  bottomCtaTitle: css({
    fontSize: 28,
    fontWeight: 700,
    color: theme.colors.text.primary,
    margin: 0,
    marginBottom: theme.spacing(1),
  }),
  bottomCtaDesc: css({
    fontSize: theme.typography.h5.fontSize,
    color: theme.colors.text.secondary,
    margin: 0,
    marginBottom: theme.spacing(4),
  }),
});

const getFeatureCardStyles = (theme: GrafanaTheme2) => ({
  card: css({
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.secondary,
    textDecoration: 'none',
    cursor: 'pointer',
    [theme.transitions.handleMotion('no-preference')]: {
      transition: theme.transitions.create(['border-color', 'transform', 'box-shadow'], {
        duration: theme.transitions.duration.short,
      }),
    },
    '&:hover': {
      borderColor: 'var(--accent)',
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px ${theme.colors.action.hover}`,
    },
  }),
  iconWrap: css({
    width: 48,
    height: 48,
    borderRadius: theme.shape.radius.default,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.colors.action.hover,
    color: 'var(--accent)',
    marginBottom: theme.spacing(2),
  }),
  cardTitle: css({
    fontSize: theme.typography.h4.fontSize,
    fontWeight: 600,
    color: theme.colors.text.primary,
    margin: 0,
    marginBottom: theme.spacing(1),
  }),
  cardDesc: css({
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.secondary,
    lineHeight: 1.5,
    margin: 0,
    flex: 1,
    marginBottom: theme.spacing(2),
  }),
  cardLink: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: 'var(--accent)',
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    marginTop: 'auto',
  }),
});

interface FeatureHighlightCardProps {
  title: string;
  description: string;
}

function FeatureHighlightCard({ title, description }: FeatureHighlightCardProps) {
  const styles = useStyles2(getFeatureHighlightCardStyles);

  return (
    <div className={styles.card}>
      <span className={styles.title}>{title}</span>
      <span className={styles.description}>{description}</span>
    </div>
  );
}

const getFeatureHighlightCardStyles = (theme: GrafanaTheme2) => ({
  card: css({
    textAlign: 'center',
    padding: theme.spacing(2),
  }),
  title: css({
    display: 'block',
    fontSize: 24,
    fontWeight: 600,
    color: theme.colors.text.primary,
    lineHeight: 1.2,
    marginBottom: theme.spacing(0.5),
  }),
  description: css({
    display: 'block',
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  }),
});
