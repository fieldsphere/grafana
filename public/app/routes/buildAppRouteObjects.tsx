import { type ComponentType, type ReactNode } from 'react';
import { type RouteObject } from 'react-router-dom';

import { type RouteDescriptor } from 'app/core/navigation/types';

import { GrafanaRouteWrapper } from '../core/navigation/GrafanaRoute';

export function buildAppRouteObjects(descriptors: RouteDescriptor[]): RouteObject[] {
  return descriptors.map((route) => ({
    path: route.path,
    caseSensitive: route.sensitive ?? false,
    element: <GrafanaRouteWrapper route={route} />,
  }));
}
