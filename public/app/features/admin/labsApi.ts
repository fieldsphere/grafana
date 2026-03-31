import { getBackendSrv } from '@grafana/runtime';

export interface FeatureToggle {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
}

export interface FeatureTogglesState {
  enabled: Record<string, boolean>;
  toggles: FeatureToggle[];
}

export const getFeatureToggles = async (): Promise<FeatureTogglesState> => {
  return getBackendSrv().get('/api/admin/feature-toggles');
};
