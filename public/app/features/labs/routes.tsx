import { Navigate } from 'react-router-dom-v5-compat';

import { SafeDynamicImport } from 'app/core/components/DynamicImports/SafeDynamicImport';
import { type RouteDescriptor } from 'app/core/navigation/types';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import { ROUTES } from './constants';

export function getRoutes(): RouteDescriptor[] {
  return [
    {
      path: ROUTES.Base,
      roles: () => contextSrv.evaluatePermission([AccessControlAction.FeatureManagementRead]),
      component: () => <Navigate replace to={ROUTES.FeatureFlags} />,
    },
    {
      path: ROUTES.FeatureFlags,
      roles: () => contextSrv.evaluatePermission([AccessControlAction.FeatureManagementRead]),
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "FeatureFlagsDashboard" */ 'app/features/labs/FeatureFlagsDashboard')
      ),
    },
  ];
}
