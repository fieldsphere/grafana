import { type Panel } from '@grafana/schema';

import { buildPanelKind } from './ResponseTransformers';

describe('ResponseTransformers angular migration contract', () => {
  it('buildPanelKind composes __angularMigration when autoMigrateFrom is set', () => {
    const panel = {
      id: 1,
      type: 'stat',
      title: 'CPU',
      autoMigrateFrom: 'singlestat',
      format: 'short',
      valueName: 'avg',
      options: { reduceOptions: { calcs: ['lastNotNull'] } },
      fieldConfig: { defaults: {}, overrides: [] },
      targets: [{ refId: 'A', expr: 'up' }],
    } as unknown as Panel;

    const panelKind = buildPanelKind(panel);
    const options = panelKind.spec.vizConfig.spec.options as Record<string, unknown>;
    const migration = options.__angularMigration as {
      autoMigrateFrom: string;
      originalOptions: Record<string, unknown>;
    };

    expect(migration.autoMigrateFrom).toBe('singlestat');
    expect(migration.originalOptions).toEqual({
      format: 'short',
      valueName: 'avg',
    });
    expect(options.reduceOptions).toEqual({ calcs: ['lastNotNull'] });
  });

  it('buildPanelKind sets autoMigrateFrom to panel type when Angular root options exist', () => {
    const panel = {
      id: 2,
      type: 'text',
      title: 'Notes',
      content: 'Hello',
      mode: 'markdown',
      options: {},
      fieldConfig: { defaults: {}, overrides: [] },
      targets: [],
    } as unknown as Panel;

    const panelKind = buildPanelKind(panel);
    const options = panelKind.spec.vizConfig.spec.options as Record<string, unknown>;
    const migration = options.__angularMigration as {
      autoMigrateFrom: string;
      originalOptions: Record<string, unknown>;
    };

    expect(migration.autoMigrateFrom).toBe('text');
    expect(migration.originalOptions).toEqual({
      content: 'Hello',
      mode: 'markdown',
    });
  });

  it('buildPanelKind filters known Panel schema properties from originalOptions', () => {
    const panel = {
      id: 3,
      type: 'stat',
      title: 'Memory',
      autoMigrateFrom: 'singlestat',
      gridPos: { x: 0, y: 0, w: 6, h: 4 },
      targets: [{ refId: 'A' }],
      transformations: [],
      fieldConfig: { defaults: {}, overrides: [] },
      format: 'bytes',
      options: {},
    } as unknown as Panel;

    const panelKind = buildPanelKind(panel);
    const options = panelKind.spec.vizConfig.spec.options as Record<string, unknown>;
    const migration = options.__angularMigration as {
      originalOptions: Record<string, unknown>;
    };

    expect(migration.originalOptions).toEqual({ format: 'bytes' });
    expect(migration.originalOptions).not.toHaveProperty('gridPos');
    expect(migration.originalOptions).not.toHaveProperty('targets');
    expect(migration.originalOptions).not.toHaveProperty('transformations');
    expect(migration.originalOptions).not.toHaveProperty('fieldConfig');
  });

  it('buildPanelKind does not compose __angularMigration for modern panels without legacy options', () => {
    const panel = {
      id: 4,
      type: 'timeseries',
      title: 'Requests',
      options: { legend: { showLegend: true } },
      fieldConfig: { defaults: {}, overrides: [] },
      targets: [{ refId: 'A' }],
    } as unknown as Panel;

    const panelKind = buildPanelKind(panel);
    const options = panelKind.spec.vizConfig.spec.options as Record<string, unknown>;

    expect(options.__angularMigration).toBeUndefined();
    expect(options.legend).toEqual({ showLegend: true });
  });
});
