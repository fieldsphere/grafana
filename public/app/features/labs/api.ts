import { getBackendSrv } from 'app/core/services/backend_srv';

export interface LabsFeatureToggle {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
}

export interface LabsFeatureTogglesResponse {
  toggles: LabsFeatureToggle[];
}

export async function getLabsFeatureToggles(): Promise<LabsFeatureTogglesResponse> {
  return getBackendSrv().get<LabsFeatureTogglesResponse>('/api/labs/feature-toggles');
}
