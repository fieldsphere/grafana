import { getBackendSrv } from '@grafana/runtime';

export interface OpenFeatureToggle {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  requiresDevMode?: boolean;
}

export function getOpenFeatureToggles(): Promise<OpenFeatureToggle[]> {
  return getBackendSrv().get<OpenFeatureToggle[]>('/api/feature-toggles/open');
}
