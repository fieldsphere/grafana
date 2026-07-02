import { SafeDynamicImport } from 'app/core/components/DynamicImports/SafeDynamicImport';
import { type RouteDescriptor } from 'app/core/navigation/types';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import { ROUTE_BASE_ID } from './constants';

export function getRoutes(): RouteDescriptor[] {
  return [
    {
      path: `/${ROUTE_BASE_ID}/*`,
      roles: () => contextSrv.evaluatePermission([AccessControlAction.SettingsRead]),
      component: SafeDynamicImport(() => import(/* webpackChunkName: "Labs"*/ 'app/features/labs/Labs')),
    },
  ];
}
