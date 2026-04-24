export interface LabsFeatureFlag {
  name: string;
  enabled: boolean;
  stage: string;
  description: string;
  expression: string;
  requiresDevMode: boolean;
  requiresRestart: boolean;
  frontendOnly: boolean;
  hasRuntimeOverride: boolean;
  runtimeOverrideValue?: boolean;
}
