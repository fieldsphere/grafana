import { Navigate } from 'react-router-dom-v5-compat';

import { SafeDynamicImport } from 'app/core/components/DynamicImports/SafeDynamicImport';
import { type RouteDescriptor } from 'app/core/navigation/types';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import { ROUTES } from './constants';

const labsRouteGuard = () => contextSrv.evaluatePermission([AccessControlAction.SettingsRead]);

export function getLabsRoutes(): RouteDescriptor[] {
  return [
    {
      path: ROUTES.Base,
      roles: labsRouteGuard,
      component: () => <Navigate replace to={ROUTES.FeatureFlags} />,
    },
    {
      path: ROUTES.FeatureFlags,
      roles: labsRouteGuard,
      component: SafeDynamicImport(
        () => import(/* webpackChunkName: "LabsFeatureFlagsPage"*/ 'app/features/labs/pages/FeatureFlagsPage')
      ),
    },
  ];
}
