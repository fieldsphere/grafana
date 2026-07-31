import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { type Store } from '@reduxjs/toolkit';
import * as React from 'react';
import { Provider } from 'react-redux';
// eslint-disable-next-line no-restricted-imports
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { CatchAllRoute } from 'test/helpers/CatchAllRoute';
import { getGrafanaContextMock } from 'test/mocks/getGrafanaContextMock';

import { locationService } from '@grafana/runtime';
import { getTestFeatureFlagClient } from '@grafana/test-utils/unstable';
import { ModalRoot } from '@grafana/ui';
import { GrafanaContext, type GrafanaContextType } from 'app/core/context/GrafanaContext';
import { ModalsContextProvider } from 'app/core/context/ModalsContextProvider';
import { toHistoryRouterHistory } from 'app/core/navigation/historyRouterAdapter';
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

  const history = React.useMemo(() => toHistoryRouterHistory(locationService.getHistory()), []);

  return (
    <Provider store={store}>
      <OpenFeatureProvider client={getTestFeatureFlagClient()}>
        <HistoryRouter history={history}>
          <CatchAllRoute>
            <ModalsContextProvider>
              <GrafanaContext.Provider value={context}>{children}</GrafanaContext.Provider>
              <ModalRoot />
            </ModalsContextProvider>
          </CatchAllRoute>
        </HistoryRouter>
      </OpenFeatureProvider>
    </Provider>
  );
}
