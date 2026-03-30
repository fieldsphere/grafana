import { css } from '@emotion/css';

import { PanelProps, GrafanaTheme2, type IconName } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { Icon, LinkButton, TextLink, useStyles2 } from '@grafana/ui';

const valueProps = [
  {
    title: 'Follow key platform flows',
    description:
      'Track dashboards, alerts, and recent work from one place instead of jumping through disconnected screens.',
    icon: 'apps',
  },
  {
    title: 'Keep onboarding moving',
    description:
      'Guide teammates from first data source to usable dashboards with clear next actions and learning paths.',
    icon: 'rocket',
  },
  {
    title: 'Standardize what matters',
    description:
      'Create repeatable views for service health, cost, and performance so every team starts from shared context.',
    icon: 'layer-group',
  },
] satisfies Array<{ title: string; description: string; icon: IconName }>;

const proofPoints = [
  { value: '4', label: 'Signals aligned' },
  { value: '1', label: 'Home workspace' },
  { value: '24/7', label: 'Operational visibility' },
];

export function HomeHighlightsPanel(_props: PanelProps) {
  const styles = useStyles2(getStyles);

  return (
    <section
      className={styles.container}
      aria-labelledby="grafana-home-highlights-title"
      data-testid="grafana-home-highlights"
    >
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <Trans i18nKey="home-highlights.home-highlights.platform-overview">Platform overview</Trans>
          </div>
          <h2 id="grafana-home-highlights-title" className={styles.title}>
            <Trans i18nKey="home-highlights.home-highlights.start-from-clearer-operating-picture">
              Start from a clearer operating picture.
            </Trans>
          </h2>
          <p className={styles.description}>
            <Trans i18nKey="home-highlights.home-highlights.use-grafana-home-as-handoff">
              Use Grafana home as the handoff between exploration, setup, and day-to-day monitoring so teams know what
              to do next.
            </Trans>
          </p>
        </div>
        <div className={styles.proofGrid}>
          {proofPoints.map((item) => (
            <div key={item.label} className={styles.proofCard}>
              <span className={styles.proofValue}>{item.value}</span>
              <span className={styles.proofLabel}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.valueGrid}>
        {valueProps.map((item) => (
          <article key={item.title} className={styles.valueCard}>
            <div className={styles.valueIcon}>
              <Icon name={item.icon} size="lg" />
            </div>
            <div className={styles.valueContent}>
              <h3 className={styles.valueTitle}>{item.title}</h3>
              <p className={styles.valueDescription}>{item.description}</p>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.actions}>
          <LinkButton href="/explore" variant="secondary" fill="outline">
            <Trans i18nKey="home-highlights.home-highlights.explore-data">Explore data</Trans>
          </LinkButton>
          <LinkButton href="/alerting/list" variant="secondary" fill="outline">
            <Trans i18nKey="home-highlights.home-highlights.review-alerts">Review alerts</Trans>
          </LinkButton>
        </div>
        <TextLink href="https://grafana.com/docs/grafana/latest/fundamentals/" external>
          <Trans i18nKey="home-highlights.home-highlights.learn-grafana-fundamentals">
            Learn the Grafana fundamentals
          </Trans>
        </TextLink>
      </div>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      height: '100%',
      padding: theme.spacing(3),
      borderRadius: theme.shape.radius.lg,
      border: `1px solid ${theme.colors.border.weak}`,
      background: theme.colors.background.primary,
      boxShadow: theme.shadows.z1,
    }),
    header: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
      gap: theme.spacing(2),

      [theme.breakpoints.down('lg')]: {
        gridTemplateColumns: '1fr',
      },
    }),
    eyebrow: css({
      display: 'inline-flex',
      width: 'fit-content',
      marginBottom: theme.spacing(1),
      padding: theme.spacing(0.5, 1.25),
      borderRadius: theme.shape.radius.pill,
      background: theme.colors.background.secondary,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      textTransform: 'uppercase',
    }),
    title: css({
      margin: 0,
      fontSize: theme.typography.h3.fontSize,
      lineHeight: theme.typography.h3.lineHeight,
    }),
    description: css({
      margin: theme.spacing(1, 0, 0),
      color: theme.colors.text.secondary,
      lineHeight: 1.6,
    }),
    proofGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: theme.spacing(1.5),

      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
      },
    }),
    proofCard: css({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: theme.spacing(0.5),
      padding: theme.spacing(2),
      borderRadius: theme.shape.radius.md,
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.weak}`,
    }),
    proofValue: css({
      fontSize: theme.typography.h2.fontSize,
      lineHeight: theme.typography.h2.lineHeight,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    proofLabel: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    valueGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: theme.spacing(1.5),

      [theme.breakpoints.down('lg')]: {
        gridTemplateColumns: '1fr',
      },
    }),
    valueCard: css({
      display: 'flex',
      gap: theme.spacing(1.5),
      padding: theme.spacing(2),
      borderRadius: theme.shape.radius.md,
      background: theme.colors.background.canvas,
      border: `1px solid ${theme.colors.border.weak}`,
    }),
    valueIcon: css({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: theme.spacing(4),
      height: theme.spacing(4),
      flexShrink: 0,
      borderRadius: theme.shape.radius.md,
      background: theme.colors.primary.transparent,
      color: theme.colors.primary.text,
    }),
    valueContent: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    }),
    valueTitle: css({
      margin: 0,
      fontSize: theme.typography.h5.fontSize,
      lineHeight: theme.typography.h5.lineHeight,
    }),
    valueDescription: css({
      margin: 0,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: 1.6,
    }),
    footer: css({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      flexWrap: 'wrap',
      marginTop: 'auto',
    }),
    actions: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(1.5),
    }),
  };
};
