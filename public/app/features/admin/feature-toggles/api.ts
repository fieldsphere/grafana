import { getBackendSrv } from '@grafana/runtime';

export interface FeatureToggleStatus {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  writeable: boolean;
  requiresRestart?: boolean;
  pendingEnabled?: boolean;
  warning?: string;
  source?: {
    kind?: string;
  };
}

export interface FeatureToggleState {
  allowEditing?: boolean;
  restartRequired?: boolean;
  enabled?: Record<string, boolean>;
  toggles?: FeatureToggleStatus[];
}

export async function getFeatureToggles(): Promise<FeatureToggleState> {
  return getBackendSrv().get('/api/admin/feature-toggles');
}

export async function setFeatureToggle(name: string, enabled: boolean): Promise<FeatureToggleState> {
  return getBackendSrv().put(`/api/admin/feature-toggles/${encodeURIComponent(name)}`, { enabled });
}

export async function clearFeatureToggleOverride(name: string): Promise<FeatureToggleState> {
  return getBackendSrv().delete(`/api/admin/feature-toggles/${encodeURIComponent(name)}`);
}
