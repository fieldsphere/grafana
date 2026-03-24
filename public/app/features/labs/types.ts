export interface FeatureToggleListItem {
  name: string;
  description: string;
  stage: string;
  enabled: boolean;
  expression: string;
  frontendOnly: boolean;
  requiresDevMode: boolean;
  requiresRestart: boolean;
}

export interface FeatureToggleListResponse {
  toggles: FeatureToggleListItem[];
}
