import { SafeDynamicImport } from 'app/core/components/DynamicImports/SafeDynamicImport';
import { type RouteDescriptor } from 'app/core/navigation/types';

import { ROUTES } from './constants';

export function getRoutes(): RouteDescriptor[] {
  return [
    {
      path: `${ROUTES.Base}/*`,
      component: SafeDynamicImport(() => import(/* webpackChunkName: "Labs" */ 'app/features/labs/Labs')),
    },
  ];
}
