import { merge } from 'lodash';

import { type GrafanaRouteComponentProps } from '../types';

export function getRouteComponentProps<T extends {} = {}, Q extends Record<string, string | null | undefined> = {}>(
  overrides: Partial<GrafanaRouteComponentProps> = {}
): GrafanaRouteComponentProps<T, Q> {
  const defaults: GrafanaRouteComponentProps<T, Q> = {
    location: {
      hash: '',
      pathname: '',
      state: {},
      search: '',
      key: 'default',
    },
    route: {
      path: '',
      component: () => null,
    },
    queryParams: {} as Q,
  };

  return merge(overrides, defaults);
}
