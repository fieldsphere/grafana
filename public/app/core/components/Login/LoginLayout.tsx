import { cx, css, keyframes } from '@emotion/css';
import { ReactNode, useEffect, useState } from 'react';
import * as React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { useStyles2 } from '@grafana/ui';

import { Branding } from '../Branding/Branding';
import { BrandingSettings } from '../Branding/types';
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
  sideContent?: ReactNode;
}

export const LoginLayout = ({
  children,
  branding,
  isChangingPassword,
  sideContent,
}: React.PropsWithChildren<LoginLayoutProps>) => {
  const loginStyles = useStyles2(getLoginStyles);
  const [startAnim, setStartAnim] = useState(false);
  const hasSideContent = Boolean(sideContent) && !isChangingPassword;
  const subTitle = branding?.loginSubtitle ?? Branding.GetLoginSubTitle();
  const loginTitle = branding?.loginTitle ?? Branding.LoginTitle;
  const loginBoxBackground = branding?.loginBoxBackground || Branding.LoginBoxBackground();
  const loginLogo = branding?.loginLogo;
  const hideEdition = branding?.hideEdition ?? Branding.HideEdition;

  useEffect(() => setStartAnim(true), []);

  return (
    <Branding.LoginBackground
      className={cx(loginStyles.container, startAnim && loginStyles.loginAnim, branding?.loginBackground)}
    >
      <div className={loginStyles.loginMain}>
        <div className={cx(loginStyles.loginSurface, hasSideContent && loginStyles.loginSurfaceWithSideContent)}>
          {hasSideContent && <div className={loginStyles.sideContent}>{sideContent}</div>}
          <div className={cx(loginStyles.loginContent, loginBoxBackground, 'login-content-box')}>
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
            <div className={loginStyles.loginOuterBox}>{children}</div>
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
      padding: theme.spacing(3, 2),
      [theme.breakpoints.up('md')]: {
        padding: theme.spacing(5, 3),
      },
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
      overflow: 'hidden',
    }),
    loginAnim: css({
      ['&:before']: {
        opacity: 1,
      },

      ['.login-content-box']: {
        opacity: 1,
      },
    }),
    loginSurface: css({
      width: '100%',
      maxWidth: 1180,
      display: 'flex',
      justifyContent: 'center',
    }),
    loginSurfaceWithSideContent: css({
      [theme.breakpoints.up('lg')]: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.1fr) minmax(420px, 0.9fr)',
        gap: theme.spacing(4),
        alignItems: 'stretch',
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
      padding: theme.spacing(4, 4, 3),
    }),
    titleWrapper: css({
      textAlign: 'center',
    }),
    mainTitle: css({
      fontSize: 22,
      margin: 0,
      lineHeight: 1.15,

      [theme.breakpoints.up('sm')]: {
        fontSize: 32,
      },
    }),
    subTitle: css({
      fontSize: theme.typography.size.md,
      color: theme.colors.text.secondary,
      margin: theme.spacing(1, 0, 0),
    }),
    loginContent: css({
      width: '100%',
      maxWidth: 520,
      display: 'flex',
      alignItems: 'stretch',
      flexDirection: 'column',
      position: 'relative',
      justifyContent: 'flex-start',
      zIndex: 1,
      minHeight: 320,
      borderRadius: theme.shape.radius.xl,
      padding: theme.spacing(2, 0),
      opacity: 0,
      border: `1px solid ${theme.colors.border.weak}`,
      boxShadow: theme.shadows.z3,
      backdropFilter: 'blur(22px)',
      [theme.transitions.handleMotion('no-preference')]: {
        transition: 'opacity 0.5s ease-in-out',
      },
      [theme.transitions.handleMotion('reduce')]: {
        opacity: 1,
      },

      [theme.breakpoints.up('sm')]: {
        minHeight: theme.spacing(40),
        justifyContent: 'center',
      },
    }),
    sideContent: css({
      display: 'none',
      [theme.breakpoints.up('lg')]: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minWidth: 0,
      },
    }),
    loginOuterBox: css({
      display: 'flex',
      overflowY: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    loginInnerBox: css({
      padding: theme.spacing(0, 4, 4),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
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
  };
};
