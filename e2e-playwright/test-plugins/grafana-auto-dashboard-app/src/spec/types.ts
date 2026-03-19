/**
 * Intermediate spec produced by the LLM (validated server-side).
 * Keep aligned with dashboardSpec.schema.json and pkg/plugin/spec.go.
 */
export interface DashboardSpec {
  title: string;
  description?: string;
  tags?: string[];
  panels: SpecPanel[];
}

export interface SpecPanel {
  title: string;
  type: 'timeseries' | 'stat';
  datasourceUid: string;
  query: string;
  unit?: string;
  legendFormat?: string;
}

export interface GenerateDashboardRequest {
  prompt: string;
  datasources: Array<{ uid: string; type: string; name: string }>;
  maxPanels?: number;
  metricHints?: string[];
}
