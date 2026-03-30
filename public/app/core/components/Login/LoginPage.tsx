import { css } from '@emotion/css';

import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Alert, LinkButton, Stack, useStyles2 } from '@grafana/ui';
import { Branding } from 'app/core/components/Branding/Branding';

import { ChangePassword } from '../ForgottenPassword/ChangePassword';
import { Page } from '../Page/Page';

import LoginCtrl from './LoginCtrl';
import { LoginForm } from './LoginForm';
import { LoginLayout, InnerBox } from './LoginLayout';
import { LoginServiceButtons } from './LoginServiceButtons';
import { UserSignup } from './UserSignup';

const LoginPage = () => {
  const styles = useStyles2(getStyles);
  const loginBranding = {
    loginBackground: styles.pageBackground,
    loginBoxBackground: styles.loginCardBackground,
  };

  document.title = Branding.AppTitle;

  return (
    <Page layout={PageLayoutType.Custom}>
      <LoginCtrl>
        {({
          loginHint,
          passwordHint,
          disableLoginForm,
          disableUserSignUp,
          login,
          isLoggingIn,
          changePassword,
          skipPasswordChange,
          isChangingPassword,
          showDefaultPasswordWarning,
          loginErrorMessage,
        }) => (
          <LoginLayout isChangingPassword={isChangingPassword} branding={loginBranding} sideContent={<LoginHero />}>
            {!isChangingPassword && (
              <InnerBox>
                {loginErrorMessage && (
                  <Alert className={styles.alert} severity="error" title={t('login.error.title', 'Login failed')}>
                    {loginErrorMessage}
                  </Alert>
                )}

                {!disableLoginForm && (
                  <LoginForm
                    onSubmit={login}
                    loginHint={loginHint}
                    passwordHint={passwordHint}
                    isLoggingIn={isLoggingIn}
                  >
                    <Stack justifyContent="flex-end">
                      {!config.auth.disableLogin && (
                        <LinkButton
                          className={styles.forgottenPassword}
                          fill="text"
                          href={`${config.appSubUrl}/user/password/send-reset-email`}
                        >
                          <Trans i18nKey="login.forgot-password">Forgot your password?</Trans>
                        </LinkButton>
                      )}
                    </Stack>
                  </LoginForm>
                )}
                <LoginServiceButtons />
                {!disableUserSignUp && <UserSignup />}
              </InnerBox>
            )}

            {isChangingPassword && (
              <InnerBox>
                <ChangePassword
                  showDefaultPasswordWarning={showDefaultPasswordWarning}
                  onSubmit={changePassword}
                  onSkip={() => skipPasswordChange()}
                />
              </InnerBox>
            )}
          </LoginLayout>
        )}
      </LoginCtrl>
    </Page>
  );
};

export default LoginPage;

const LoginHero = () => {
  const styles = useStyles2(getStyles);
  const heroStats = [
    { label: t('login.hero.stat.coverage', 'Coverage'), value: t('login.hero.value.coverage', 'Full-stack') },
    { label: t('login.hero.stat.setup', 'Setup'), value: t('login.hero.value.setup', 'Minutes') },
    { label: t('login.hero.stat.teams', 'Teams'), value: t('login.hero.value.teams', 'One workspace') },
  ];
  const heroPoints = [
    t('login.hero.point.unify', 'See signal across metrics, logs, traces, and frontend performance in one place.'),
    t('login.hero.point.root-cause', 'Move from incident detection to root cause analysis without switching tools.'),
    t('login.hero.point.setup', 'Roll out observability with opinionated dashboards and fast setup.'),
  ];

  return (
    <div className={styles.heroPanel}>
      <div className={styles.heroEyebrow}>
        <Trans i18nKey="login.hero.eyebrow">Observability platform</Trans>
      </div>
      <h2 className={styles.heroTitle}>
        <Trans i18nKey="login.hero.title">Understand production health before issues reach users.</Trans>
      </h2>
      <p className={styles.heroDescription}>
        <Trans i18nKey="login.hero.description">
          Unify dashboards, telemetry, and troubleshooting workflows so teams can detect issues earlier and resolve them
          faster.
        </Trans>
      </p>

      <div className={styles.heroStats}>
        {heroStats.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.heroList}>
        {heroPoints.map((point) => (
          <div key={point} className={styles.heroListItem}>
            <span className={styles.heroListMarker} />
            <span>{point}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    forgottenPassword: css({
      padding: 0,
      marginTop: theme.spacing(0.5),
    }),

    alert: css({
      width: '100%',
    }),

    heroPanel: css({
      position: 'relative',
      padding: theme.spacing(4),
      borderRadius: theme.shape.radius.default,
      color: theme.colors.text.primary,
      background: theme.isDark
        ? 'linear-gradient(145deg, rgba(20,18,11,0.9) 0%, rgba(34,26,23,0.86) 50%, rgba(52,27,18,0.92) 100%)'
        : 'linear-gradient(145deg, rgba(255,248,242,0.92) 0%, rgba(248,241,236,0.96) 45%, rgba(244,233,225,0.98) 100%)',
      border: `1px solid ${theme.colors.border.weak}`,
      boxShadow: theme.shadows.z2,
      overflow: 'hidden',
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: 'auto -15% -30% auto',
        width: 280,
        height: 280,
        borderRadius: theme.shape.radius.circle,
        background: 'radial-gradient(circle, rgba(245,78,0,0.26) 0%, rgba(245,78,0,0) 72%)',
        pointerEvents: 'none',
      },
    }),

    pageBackground: css({
      background: theme.isDark
        ? 'radial-gradient(circle at top left, rgba(245,78,0,0.16), rgba(245,78,0,0) 26%), linear-gradient(180deg, rgba(20,18,11,0.98) 0%, rgba(26,22,18,0.98) 42%, rgba(14,13,11,1) 100%)'
        : 'radial-gradient(circle at top left, rgba(245,78,0,0.12), rgba(245,78,0,0) 28%), linear-gradient(180deg, rgba(247,247,244,1) 0%, rgba(242,241,237,1) 46%, rgba(235,234,229,1) 100%)',
    }),

    loginCardBackground: css({
      background: theme.isDark
        ? 'linear-gradient(180deg, rgba(27,25,19,0.92) 0%, rgba(22,20,16,0.94) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(247,247,244,0.94) 100%)',
    }),

    heroEyebrow: css({
      fontSize: theme.typography.size.sm,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: theme.colors.warning.text,
      marginBottom: theme.spacing(2),
    }),

    heroTitle: css({
      fontSize: theme.typography.h1.fontSize,
      lineHeight: 1.05,
      margin: 0,
      maxWidth: 560,
    }),

    heroDescription: css({
      margin: theme.spacing(2, 0, 3),
      fontSize: theme.typography.size.lg,
      lineHeight: 1.5,
      color: theme.colors.text.secondary,
      maxWidth: 620,
    }),

    heroStats: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: theme.spacing(1.5),
      marginBottom: theme.spacing(3),
      [theme.breakpoints.up('sm')]: {
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      },
    }),

    statCard: css({
      padding: theme.spacing(2),
      borderRadius: theme.shape.radius.lg,
      background: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.62)',
      border: `1px solid ${theme.colors.border.weak}`,
      minHeight: 92,
    }),

    statValue: css({
      fontSize: theme.typography.h4.fontSize,
      fontWeight: theme.typography.fontWeightBold,
      marginBottom: theme.spacing(0.75),
    }),

    statLabel: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.size.sm,
    }),

    heroList: css({
      display: 'grid',
      gap: theme.spacing(1.5),
      maxWidth: 620,
    }),

    heroListItem: css({
      display: 'flex',
      gap: theme.spacing(1.5),
      alignItems: 'flex-start',
      color: theme.colors.text.secondary,
      lineHeight: 1.5,
    }),

    heroListMarker: css({
      width: 10,
      height: 10,
      borderRadius: theme.shape.radius.circle,
      background: theme.colors.warning.main,
      boxShadow: `0 0 0 6px ${theme.isDark ? 'rgba(245,78,0,0.14)' : 'rgba(245,78,0,0.12)'}`,
      marginTop: theme.spacing(0.75),
      flexShrink: 0,
    }),
  };
};
