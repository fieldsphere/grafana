import { ComponentType, ReactNode, type JSX } from 'react';
import { Router as LegacyRouter } from 'react-router-dom';
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom-v5-compat';

import { locationService, LocationServiceProvider } from '@grafana/runtime';
import { ModalRoot, Stack } from '@grafana/ui';

import { AppChrome } from '../core/components/AppChrome/AppChrome';
import { AppChromeExtensionPoint } from '../core/components/AppChrome/AppChromeExtensionPoint';
import { AppNotificationList } from '../core/components/AppNotifications/AppNotificationList';
import { ModalsContextProvider } from '../core/context/ModalsContextProvider';
import { QueriesDrawerContextProvider } from '../features/explore/QueriesDrawer/QueriesDrawerContext';

function ExtraProviders(props: { children: ReactNode; providers: Array<ComponentType<{ children: ReactNode }>> }) {
  return props.providers.reduce((tree, Provider): ReactNode => {
    return <Provider>{tree}</Provider>;
  }, props.children);
}

type RouterWrapperProps = {
  routes?: JSX.Element | false;
  bodyRenderHooks: ComponentType[];
  pageBanners: ComponentType[];
  providers: Array<ComponentType<{ children: ReactNode }>>;
};
export function RouterWrapper(props: RouterWrapperProps) {
  return (
    <LegacyRouter history={locationService.getHistory()}>
      <HistoryRouter
        history={locationService.getRouterHistory()}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <LocationServiceProvider service={locationService}>
          <QueriesDrawerContextProvider>
            <ExtraProviders providers={props.providers}>
              <ModalsContextProvider>
                <AppChrome>
                  <AppNotificationList />
                  <Stack gap={0} grow={1} direction="column">
                    <AppChromeExtensionPoint />
                    {props.pageBanners.map((Banner, index) => (
                      <Banner key={index.toString()} />
                    ))}
                    {props.routes}
                  </Stack>
                  {props.bodyRenderHooks.map((Hook, index) => (
                    <Hook key={index.toString()} />
                  ))}
                </AppChrome>
                <ModalRoot />
              </ModalsContextProvider>
            </ExtraProviders>
          </QueriesDrawerContextProvider>
        </LocationServiceProvider>
      </HistoryRouter>
    </LegacyRouter>
  );
}
