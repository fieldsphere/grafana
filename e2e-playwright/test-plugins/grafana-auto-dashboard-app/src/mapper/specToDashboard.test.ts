import type { Panel } from '@grafana/schema';

import { specToDashboard } from './specToDashboard';
import type { DashboardSpec } from '../spec/types';

describe('specToDashboard', () => {
  it('maps prometheus timeseries and stat panels', () => {
    const spec: DashboardSpec = {
      title: 'Test dash',
      tags: ['t1'],
      panels: [
        {
          title: 'Rate',
          type: 'timeseries',
          datasourceUid: 'prom1',
          query: 'sum(rate(http_requests_total[5m]))',
          legendFormat: '{{job}}',
        },
        {
          title: 'Errors',
          type: 'stat',
          datasourceUid: 'prom1',
          query: 'sum(rate(http_requests_total{status=~"5.."}[5m]))',
          unit: 'percentunit',
        },
      ],
    };
    const dash = specToDashboard(spec, { prom1: 'prometheus' });
    expect(dash.title).toBe('Test dash');
    expect(dash.panels).toHaveLength(2);
    expect(dash.panels?.[0].type).toBe('timeseries');
    expect(dash.panels?.[1].type).toBe('stat');
    expect((dash.panels?.[0] as Panel).targets?.[0]).toMatchObject({
      expr: 'sum(rate(http_requests_total[5m]))',
      refId: 'A',
    });
  });

  it('throws on unknown datasource uid', () => {
    const spec: DashboardSpec = {
      title: 'x',
      panels: [
        {
          title: 'p',
          type: 'timeseries',
          datasourceUid: 'missing',
          query: 'up',
        },
      ],
    };
    expect(() => specToDashboard(spec, {})).toThrow(/Unknown datasource/);
  });
});
