import { getBackendSrv } from '@grafana/runtime';

import { LabsFeatureFlag } from './types';

export function getLabsFeatureToggles() {
  return getBackendSrv().get<LabsFeatureFlag[]>('/api/labs/feature-toggles');
}

export function setLabsFeatureToggle(flag: string, enabled: boolean) {
  return getBackendSrv().put(`/api/labs/feature-toggles/${encodeURIComponent(flag)}`, { enabled });
}

export function clearLabsFeatureToggleOverride(flag: string) {
  return getBackendSrv().request({
    url: `/api/labs/feature-toggles/${encodeURIComponent(flag)}`,
    method: 'DELETE',
  });
}
