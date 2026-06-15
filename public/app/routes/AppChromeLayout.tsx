import { type ComponentType, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

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

export type AppChromeLayoutProps = {
  bodyRenderHooks: ComponentType[];
  pageBanners: ComponentType[];
  providers: Array<ComponentType<{ children: ReactNode }>>;
};

export function AppChromeLayout(props: AppChromeLayoutProps) {
  return (
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
              <Outlet />
            </Stack>
            {props.bodyRenderHooks.map((Hook, index) => (
              <Hook key={index.toString()} />
            ))}
          </AppChrome>
          <ModalRoot />
        </ModalsContextProvider>
      </ExtraProviders>
    </QueriesDrawerContextProvider>
  );
}
