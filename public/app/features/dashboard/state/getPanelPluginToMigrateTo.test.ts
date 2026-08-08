import { getPanelPluginToMigrateTo } from './getPanelPluginToMigrateTo';

describe('getPanelPluginToMigrateTo', () => {
  it.each([
    ['graph default', { type: 'graph' }, 'timeseries'],
    ['graphite default', { type: 'graphite' }, 'timeseries'],
    [
      'graph series mode without legend values',
      { type: 'graph', xaxis: { mode: 'series' } },
      'barchart',
    ],
    [
      'graph series mode with legend values',
      { type: 'graph', xaxis: { mode: 'series' }, legend: { values: true } },
      'bargauge',
    ],
    ['graph histogram mode', { type: 'graph', xaxis: { mode: 'histogram' } }, 'histogram'],
    ['table-old', { type: 'table-old' }, 'table'],
    ['singlestat', { type: 'singlestat' }, 'stat'],
    ['grafana-singlestat-panel', { type: 'grafana-singlestat-panel' }, 'stat'],
    ['grafana-piechart-panel', { type: 'grafana-piechart-panel' }, 'piechart'],
    ['grafana-worldmap-panel', { type: 'grafana-worldmap-panel' }, 'geomap'],
    ['natel-discrete-panel', { type: 'natel-discrete-panel' }, 'state-timeline'],
  ] as const)('%s', (_name, panel, expected) => {
    expect(getPanelPluginToMigrateTo(panel)).toBe(expected);
  });

  it('returns undefined for modern panel types', () => {
    expect(getPanelPluginToMigrateTo({ type: 'timeseries' })).toBeUndefined();
  });
});
