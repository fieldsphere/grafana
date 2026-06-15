import { type Store } from '@reduxjs/toolkit';
import { createRouter } from '@remix-run/router';
import * as React from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { getGrafanaContextMock } from 'test/mocks/getGrafanaContextMock';

import { locationService } from '@grafana/runtime';
import { ModalRoot } from '@grafana/ui';
import { GrafanaContext, type GrafanaContextType } from 'app/core/context/GrafanaContext';
import { ModalsContextProvider } from 'app/core/context/ModalsContextProvider';
import { configureStore } from 'app/store/configureStore';
import { type StoreState } from 'app/types/store';

export interface Props {
  storeState?: Partial<StoreState>;
  store?: Store<StoreState>;
  children: React.ReactNode;
  grafanaContext?: GrafanaContextType;
}

/**
 * Wrapps component in redux store provider, Router and GrafanaContext
 *
 * @deprecated Use `test/test-utils` `render` method instead
 */
export function TestProvider(props: Props) {
  const { store = configureStore(props.storeState), children } = props;

  const context = {
    ...getGrafanaContextMock(),
    ...props.grafanaContext,
  };

  const router = React.useMemo(
    () =>
      createRouter({
        history: locationService.getHistory(),
        routes: [{ path: '*', element: <>{children}</> }],
      }),
    [children]
  );

  return (
    <Provider store={store}>
      <RouterProvider router={router}>
        <ModalsContextProvider>
          <GrafanaContext.Provider value={context}>
            <ModalRoot />
          </GrafanaContext.Provider>
        </ModalsContextProvider>
      </RouterProvider>
    </Provider>
  );
}
