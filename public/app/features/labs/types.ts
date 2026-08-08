export interface ToggleStatus {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  writeable: boolean;
  warning?: string;
}

export interface ResolvedToggleState {
  allowEditing: boolean;
  restartRequired: boolean;
  enabled: Record<string, boolean>;
  toggles: ToggleStatus[];
}
