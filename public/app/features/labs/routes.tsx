import { SafeDynamicImport } from 'app/core/components/DynamicImports/SafeDynamicImport';
import { type RouteDescriptor } from 'app/core/navigation/types';

export function getLabsRoutes(): RouteDescriptor[] {
  return [
    {
      path: '/labs',
      component: SafeDynamicImport(() => import(/* webpackChunkName: "LabsPage" */ 'app/features/labs/LabsPage')),
    },
  ];
}
