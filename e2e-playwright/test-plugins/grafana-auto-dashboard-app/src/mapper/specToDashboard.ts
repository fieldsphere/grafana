import {
  Dashboard,
  FieldColorModeId,
  FieldConfigSource,
  Panel,
  ThresholdsMode,
  defaultDashboard,
} from '@grafana/schema';

import { DashboardSpec } from '../spec/types';

const COLS = 24;
const TS_H = 8;
const STAT_H = 4;

function datasourceRef(uid: string, dsType: string): { type: string; uid: string } {
  return { type: dsType, uid };
}

function baseFieldConfig(unit?: string): FieldConfigSource {
  return {
    defaults: {
      color: { mode: FieldColorModeId.PaletteClassic },
      custom: {
        axisBorderShow: false,
        axisCenteredZero: false,
        axisColorMode: 'text' as const,
        axisLabel: '',
        axisPlacement: 'auto' as const,
        barAlignment: 0,
        barWidthFactor: 0.6,
        drawStyle: 'line' as const,
        fillOpacity: 10,
        gradientMode: 'none' as const,
        hideFrom: { legend: false, tooltip: false, viz: false },
        insertNulls: false,
        lineInterpolation: 'linear' as const,
        lineWidth: 1,
        pointSize: 5,
        scaleDistribution: { type: 'linear' as const },
        showPoints: 'never' as const,
        spanNulls: false,
        stacking: { group: 'A', mode: 'none' as const },
        thresholdsStyle: { mode: 'off' as const },
      },
      mappings: [],
      thresholds: {
        mode: ThresholdsMode.Absolute,
        steps: [
          { color: 'green', value: null },
          { color: 'red', value: 80 },
        ],
      },
      ...(unit ? { unit } : {}),
    },
    overrides: [],
  };
}

function prometheusTarget(expr: string, legendFormat?: string, uid?: string, dsType?: string) {
  return {
    datasource: uid && dsType ? datasourceRef(uid, dsType) : undefined,
    editorMode: 'code' as const,
    expr,
    interval: '',
    legendFormat: legendFormat ?? '',
    range: true,
    refId: 'A',
  };
}

function buildTimeseriesPanel(
  id: number,
  gridPos: { x: number; y: number; w: number; h: number },
  title: string,
  uid: string,
  dsType: string,
  query: string,
  unit?: string,
  legendFormat?: string
): Panel {
  const ds = datasourceRef(uid, dsType);
  return {
    id,
    type: 'timeseries',
    title,
    gridPos,
    datasource: ds,
    fieldConfig: baseFieldConfig(unit),
    options: {
      legend: {
        calcs: [],
        displayMode: 'list',
        placement: 'bottom',
        showLegend: true,
      },
      tooltip: { hideZeros: false, mode: 'single', sort: 'none' },
    },
    targets: [prometheusTarget(query, legendFormat, uid, dsType)],
  };
}

function buildStatPanel(
  id: number,
  gridPos: { x: number; y: number; w: number; h: number },
  title: string,
  uid: string,
  dsType: string,
  query: string,
  unit?: string
): Panel {
  const ds = datasourceRef(uid, dsType);
  const fc = baseFieldConfig(unit);
  return {
    id,
    type: 'stat',
    title,
    gridPos,
    datasource: ds,
    fieldConfig: {
      ...fc,
      defaults: {
        ...fc.defaults,
        color: { mode: FieldColorModeId.Thresholds },
      },
    },
    options: {
      colorMode: 'value',
      graphMode: 'none',
      justifyMode: 'auto',
      orientation: 'auto',
      percentChangeColorMode: 'standard',
      reduceOptions: {
        calcs: ['lastNotNull'],
        fields: '',
        values: false,
      },
      showPercentChange: false,
      textMode: 'auto',
      wideLayout: true,
    },
    targets: [prometheusTarget(query, undefined, uid, dsType)],
  };
}

/**
 * Maps a validated DashboardSpec to Grafana dashboard JSON (legacy model).
 * @param datasourceTypes maps datasource UID -> Grafana datasource type (e.g. prometheus)
 */
export function specToDashboard(spec: DashboardSpec, datasourceTypes: Record<string, string>): Dashboard {
  const panels: Panel[] = [];
  let y = 0;
  let id = 1;

  // Timeseries are full width; stats are placed 3 per row
  let col = 0;
  for (const p of spec.panels) {
    const dsType = datasourceTypes[p.datasourceUid];
    if (!dsType) {
      throw new Error(`Unknown datasource uid: ${p.datasourceUid}`);
    }

    if (p.type === 'stat') {
      const w = 8;
      const x = col * w;
      panels.push(
        buildStatPanel(id++, { h: STAT_H, w, x, y }, p.title, p.datasourceUid, dsType, p.query, p.unit)
      );
      col += 1;
      if (col >= 3) {
        col = 0;
        y += STAT_H;
      }
      continue;
    }

    // timeseries: full width rows for readability
    if (col !== 0) {
      y += STAT_H;
      col = 0;
    }
    panels.push(
      buildTimeseriesPanel(
        id++,
        { h: TS_H, w: COLS, x: 0, y },
        p.title,
        p.datasourceUid,
        dsType,
        p.query,
        p.unit,
        p.legendFormat
      )
    );
    y += TS_H;
  }

  return {
    ...defaultDashboard,
    title: spec.title,
    description: spec.description,
    tags: spec.tags ?? ['auto-dashboard'],
    schemaVersion: defaultDashboard.schemaVersion ?? 42,
    time: { from: 'now-6h', to: 'now' },
    refresh: '30s',
    panels,
  } as Dashboard;
}
