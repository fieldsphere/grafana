import { cx, css, keyframes } from '@emotion/css';
import { useEffect, useState } from 'react';
import * as React from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { useStyles2 } from '@grafana/ui';

import { Branding } from '../Branding/Branding';
import { type BrandingSettings } from '../Branding/types';
import { Footer } from '../Footer/Footer';

interface InnerBoxProps {
  enterAnimation?: boolean;
}
export const InnerBox = ({ children, enterAnimation = true }: React.PropsWithChildren<InnerBoxProps>) => {
  const loginStyles = useStyles2(getLoginStyles);
  return <div className={cx(loginStyles.loginInnerBox, enterAnimation && loginStyles.enterAnimation)}>{children}</div>;
};

export interface LoginLayoutProps {
  /** Custom branding settings that can be used e.g. for previewing the Login page changes */
  branding?: BrandingSettings;
  isChangingPassword?: boolean;
  showHeroPanel?: boolean;
}

export const LoginLayout = ({
  children,
  branding,
  isChangingPassword,
  showHeroPanel = false,
}: React.PropsWithChildren<LoginLayoutProps>) => {
  const loginStyles = useStyles2(getLoginStyles);
  const [startAnim, setStartAnim] = useState(false);
  const subTitle = branding?.loginSubtitle ?? Branding.GetLoginSubTitle();
  const loginTitle = branding?.loginTitle ?? Branding.LoginTitle;
  const loginBoxBackground = branding?.loginBoxBackground || Branding.LoginBoxBackground();
  const loginLogo = branding?.loginLogo;
  const hideEdition = branding?.hideEdition ?? Branding.HideEdition;
  const shouldShowHeroPanel = showHeroPanel && !isChangingPassword;

  useEffect(() => setStartAnim(true), []);

  return (
    <Branding.LoginBackground
      className={cx(loginStyles.container, startAnim && loginStyles.loginAnim, branding?.loginBackground)}
    >
      <div className={loginStyles.loginMain}>
        <div className={cx(loginStyles.loginContent, loginBoxBackground, 'login-content-box')}>
          {shouldShowHeroPanel && (
            <div className={loginStyles.heroPanel}>
              <div className={loginStyles.loginLogoWrapper}>
                <Branding.LoginLogo className={loginStyles.loginLogo} logo={loginLogo} />
                <div className={loginStyles.titleWrapper}>
                  <h1 className={loginStyles.mainTitle}>{loginTitle}</h1>
                  {subTitle && <h3 className={loginStyles.subTitle}>{subTitle}</h3>}
                </div>
              </div>
              <p className={loginStyles.heroDescription}>
                <Trans i18nKey="login.layout.hero-description">
                  See metrics, logs, traces, and incidents in one place with fast, actionable observability.
                </Trans>
              </p>
              <div className={loginStyles.heroStats}>
                <div className={loginStyles.heroStatCard}>
                  <span className={loginStyles.heroStatValue}>
                    <Trans i18nKey="login.layout.hero-stat-platform-value">1</Trans>
                  </span>
                  <span className={loginStyles.heroStatLabel}>
                    <Trans i18nKey="login.layout.hero-stat-platform">Unified platform</Trans>
                  </span>
                </div>
                <div className={loginStyles.heroStatCard}>
                  <span className={loginStyles.heroStatValue}>
                    <Trans i18nKey="login.layout.hero-stat-visibility-value">100%</Trans>
                  </span>
                  <span className={loginStyles.heroStatLabel}>
                    <Trans i18nKey="login.layout.hero-stat-visibility">Service visibility</Trans>
                  </span>
                </div>
                <div className={loginStyles.heroStatCard}>
                  <span className={loginStyles.heroStatValue}>
                    <Trans i18nKey="login.layout.hero-stat-alerting-value">24/7</Trans>
                  </span>
                  <span className={loginStyles.heroStatLabel}>
                    <Trans i18nKey="login.layout.hero-stat-alerting">Context-aware alerting</Trans>
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className={cx(loginStyles.loginOuterBox, !shouldShowHeroPanel && loginStyles.loginOuterBoxFullWidth)}>
            {!shouldShowHeroPanel && (
              <div className={loginStyles.loginLogoWrapper}>
                <Branding.LoginLogo className={loginStyles.loginLogo} logo={loginLogo} />
                <div className={loginStyles.titleWrapper}>
                  {isChangingPassword ? (
                    <h1 className={loginStyles.mainTitle}>
                      <Trans i18nKey="login.layout.update-password">Update your password</Trans>
                    </h1>
                  ) : (
                    <>
                      <h1 className={loginStyles.mainTitle}>{loginTitle}</h1>
                      {subTitle && <h3 className={loginStyles.subTitle}>{subTitle}</h3>}
                    </>
                  )}
                </div>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
      {branding?.hideFooter ? <></> : <Footer hideEdition={hideEdition} customLinks={branding?.footerLinks} />}
    </Branding.LoginBackground>
  );
};

const flyInAnimation = keyframes`
from{
  opacity: 0;
  transform: translate(-60px, 0px);
}

to{
  opacity: 1;
  transform: translate(0px, 0px);
}`;

export const getLoginStyles = (theme: GrafanaTheme2) => {
  return {
    loginMain: css({
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '100%',
    }),
    container: css({
      minHeight: '100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      flex: 1,
      minWidth: '100%',
      marginLeft: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    loginAnim: css({
      ['&:before']: {
        opacity: 1,
      },

      ['.login-content-box']: {
        opacity: 1,
      },
    }),
    submitButton: css({
      justifyContent: 'center',
      width: '100%',
    }),
    loginLogo: css({
      width: '100%',
      maxWidth: 60,
      marginBottom: theme.spacing(2),

      [theme.breakpoints.up('sm')]: {
        maxWidth: 100,
      },
    }),
    loginLogoWrapper: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: theme.spacing(3),
    }),
    titleWrapper: css({
      textAlign: 'center',
    }),
    mainTitle: css({
      fontSize: 22,

      [theme.breakpoints.up('sm')]: {
        fontSize: 32,
      },
    }),
    subTitle: css({
      fontSize: theme.typography.size.md,
      color: theme.colors.text.secondary,
    }),
    loginContent: css({
      maxWidth: 1040,
      width: `calc(100% - 2rem)`,
      display: 'flex',
      alignItems: 'stretch',
      flexDirection: 'column',
      position: 'relative',
      justifyContent: 'flex-start',
      zIndex: 1,
      minHeight: 380,
      borderRadius: theme.shape.radius.lg,
      padding: theme.spacing(1),
      background: `linear-gradient(140deg, ${theme.colors.background.primary}, ${theme.colors.background.secondary})`,
      border: `1px solid ${theme.colors.border.weak}`,
      boxShadow: theme.shadows.z3,
      opacity: 0,
      [theme.transitions.handleMotion('no-preference')]: {
        transition: 'opacity 0.5s ease-in-out',
      },
      [theme.transitions.handleMotion('reduce')]: {
        opacity: 1,
      },

      [theme.breakpoints.up('sm')]: {
        minHeight: theme.spacing(52),
        justifyContent: 'center',
        flexDirection: 'row',
      },
    }),
    heroPanel: css({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: theme.spacing(2),
      padding: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        width: '54%',
        padding: theme.spacing(4),
      },
    }),
    loginOuterBox: css({
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'hidden',
      alignItems: 'stretch',
      justifyContent: 'center',
      borderRadius: theme.shape.radius.md,
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.weak}`,
      margin: theme.spacing(1),
      [theme.breakpoints.up('sm')]: {
        width: '46%',
        margin: theme.spacing(2),
      },
    }),
    loginOuterBoxFullWidth: css({
      [theme.breakpoints.up('sm')]: {
        width: '100%',
      },
    }),
    loginInnerBox: css({
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      flexGrow: 1,
      maxWidth: 415,
      width: '100%',
      transform: 'translate(0px, 0px)',
      [theme.transitions.handleMotion('no-preference')]: {
        transition: '0.25s ease',
      },
    }),
    enterAnimation: css({
      [theme.transitions.handleMotion('no-preference')]: {
        animation: `${flyInAnimation} ease-out 0.2s`,
      },
    }),
    heroDescription: css({
      fontSize: theme.typography.size.lg,
      lineHeight: theme.typography.body.lineHeight,
      color: theme.colors.text.secondary,
      margin: 0,
      maxWidth: 560,
    }),
    heroStats: css({
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: theme.spacing(1),
      [theme.breakpoints.up('md')]: {
        gridTemplateColumns: 'repeat(3, 1fr)',
      },
    }),
    heroStatCard: css({
      background: theme.isDark
        ? 'linear-gradient(140deg, rgba(245, 78, 0, 0.22), rgba(245, 78, 0, 0.1))'
        : 'linear-gradient(140deg, rgba(245, 78, 0, 0.16), rgba(245, 78, 0, 0.05))',
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.md,
      padding: theme.spacing(1.25, 1.5),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    }),
    heroStatValue: css({
      fontSize: theme.typography.h3.fontSize,
      fontWeight: theme.typography.fontWeightBold,
      color: theme.colors.text.primary,
      lineHeight: 1.2,
    }),
    heroStatLabel: css({
      fontSize: theme.typography.size.sm,
      color: theme.colors.text.secondary,
    }),
  };
};
