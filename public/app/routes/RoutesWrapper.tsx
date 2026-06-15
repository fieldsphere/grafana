import { createRouter } from '@remix-run/router';
import { useMemo, type ComponentType, type ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';

import { config, locationService, LocationServiceProvider } from '@grafana/runtime';

import { AppChromeLayout } from './AppChromeLayout';
import { buildAppRouteObjects } from './buildAppRouteObjects';
import { getAppRoutes } from './routes';

type RouterWrapperProps = {
  routesReady: boolean;
  bodyRenderHooks: ComponentType[];
  pageBanners: ComponentType[];
  providers: Array<ComponentType<{ children: ReactNode }>>;
};

export function RouterWrapper(props: RouterWrapperProps) {
  const shellProps = {
    bodyRenderHooks: props.bodyRenderHooks,
    pageBanners: props.pageBanners,
    providers: props.providers,
  };

  const router = useMemo(() => {
    if (!props.routesReady) {
      return null;
    }

    return createRouter({
      history: locationService.getHistory(),
      basename: config.appSubUrl ?? '/',
      routes: [
        {
          id: 'app-chrome',
          element: <AppChromeLayout {...shellProps} />,
          children: buildAppRouteObjects(getAppRoutes()),
        },
      ],
    });
  }, [props.routesReady, props.bodyRenderHooks, props.pageBanners, props.providers]);

  if (!router) {
    return null;
  }

  return (
    <LocationServiceProvider service={locationService}>
      <RouterProvider router={router} />
    </LocationServiceProvider>
  );
}
