import { type IconName } from '@grafana/ui';

export type TrendDirection = 'up' | 'down' | 'flat';

export type MetricStatus = 'good' | 'warning' | 'critical' | 'info';

export interface CodeHealthMetric {
  id: string;
  label: string;
  value: number;
  unit?: string;
  status: MetricStatus;
  trend: TrendDirection;
  trendDelta: number;
  description: string;
  icon: IconName;
  history: number[];
}

export type ActionSeverity = 'low' | 'medium' | 'high';

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  severity: ActionSeverity;
  area: string;
  metricId: string;
}

export type TimeRange = '7d' | '30d' | '90d';
