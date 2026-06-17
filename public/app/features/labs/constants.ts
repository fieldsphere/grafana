export const ROUTE_BASE_ID = 'labs';

export const ROUTES = {
  Base: `/${ROUTE_BASE_ID}`,
  FeatureFlags: `/${ROUTE_BASE_ID}/feature-flags`,
} as const;

export const FEATURE_TOGGLE_STORAGE_KEY = 'grafana.featureToggles';
