import {
  createDataFrame,
  createTheme,
  FieldColorModeId,
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  type DataFrame,
  type Field,
  type FieldConfigSource,
} from '@grafana/data';

import { PointShape, SeriesMapping, XYShowMode } from './panelcfg.gen';
import { fmt, getCommonPrefixSuffix, prepSeries } from './utils';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  config: {
    ...jest.requireActual('@grafana/runtime').config,
    theme2: createTheme(),
  },
}));

const theme = createTheme();

const fieldConfig: FieldConfigSource = { defaults: {}, overrides: [] };

const defaultCustom = {
  show: XYShowMode.Points,
  pointShape: PointShape.Circle,
  pointStrokeWidth: 1,
  fillOpacity: 50,
  lineWidth: 2,
  lineStyle: { fill: 'solid' },
  pointSize: { fixed: 5, min: 1, max: 10 },
};

interface FieldDef {
  name: string;
  type?: FieldType;
  values: unknown[];
  config?: Record<string, unknown>;
}

function makeFrame(fields: FieldDef[]): DataFrame {
  return createDataFrame({
    fields: fields.map(({ type = FieldType.number, config, ...rest }) => ({
      ...rest,
      type,
      config: {
        ...(config ?? {}),
        custom: { ...defaultCustom, ...((config?.custom as Record<string, unknown>) ?? {}) },
      },
    })),
  });
}

describe('fmt', () => {
  it('formats value using field.display when available', () => {
    const frame = createDataFrame({
      fields: [{ name: 'temp', type: FieldType.number, values: [42], config: { unit: 'celsius' } }],
    });
    const field = frame.fields[0];
    field.display = getDisplayProcessor({ field, theme });

    expect(fmt(field, 42)).toBe(formattedValueToString(field.display(42)));
  });

  it('falls back to string coercion when field.display is undefined', () => {
    const field: Field = {
      name: 'raw',
      type: FieldType.number,
      values: [42],
      config: {},
    };
    expect(fmt(field, 42)).toBe('42');
  });
});

describe('getCommonPrefixSuffix', () => {
  it('extracts common prefix and suffix tokens', () => {
    expect(getCommonPrefixSuffix(['cpu idle A', 'cpu idle B'])).toBe('cpu idle');
  });

  it('returns empty string when single-token names share the same token', () => {
    expect(getCommonPrefixSuffix(['cpu', 'cpu'])).toBe('');
  });

  it('returns empty string when no common parts', () => {
    expect(getCommonPrefixSuffix(['foo', 'bar'])).toBe('');
  });
});

describe('prepSeries', () => {
  it('returns empty series and no warn when no frames provided', () => {
    const { series, warn } = prepSeries(SeriesMapping.Auto, [], [], fieldConfig);
    expect(series).toEqual([]);
    expect(warn).toBeNull();
  });

  it('creates series from auto-mapped number fields', () => {
    const frame = makeFrame([
      { name: 'x', values: [1, 2, 3] },
      { name: 'y1', values: [10, 20, 30] },
      { name: 'y2', values: [40, 50, 60] },
    ]);

    const { series, warn } = prepSeries(SeriesMapping.Auto, [], [frame], fieldConfig);

    expect(series).toHaveLength(2);
    expect(series[0].x.field.name).toBe('x');
    expect(series[0].y.field.name).toBe('y1');
    expect(series[1].x.field.name).toBe('x');
    expect(series[1].y.field.name).toBe('y2');
    expect(warn).toBeNull();
  });

  describe('field filtering', () => {
    it('skips fields already used as color or size in auto mode', () => {
      const frame = makeFrame([
        { name: 'x', values: [1, 2, 3] },
        { name: 'y', values: [10, 20, 30] },
        { name: 'colorField', values: [0.1, 0.5, 0.9] },
        { name: 'sizeField', values: [5, 10, 15] },
      ]);

      const { series } = prepSeries(
        SeriesMapping.Auto,
        [
          {
            color: { matcher: { id: 'byName', options: 'colorField' } },
            size: { matcher: { id: 'byName', options: 'sizeField' } },
          },
        ],
        [frame],
        fieldConfig
      );

      expect(series).toHaveLength(1);
      expect(series[0].y.field.name).toBe('y');
    });
  });

  describe('manual mapping warnings', () => {
    const frame = () =>
      makeFrame([
        { name: 'x', values: [1, 2] },
        { name: 'y', values: [10, 20] },
      ]);

    const frameMatcher = { matcher: { id: 'byIndex', options: 0 } };
    const xMatcher = { matcher: { id: 'byName', options: 'x' } };
    const yMatcher = { matcher: { id: 'byName', options: 'y' } };

    it('warns when both X and Y matchers are missing', () => {
      const { series, warn } = prepSeries(SeriesMapping.Manual, [{ frame: frameMatcher }], [frame()], fieldConfig);

      expect(series).toEqual([]);
      expect(warn).toBe('X and Y fields must be mapped');
    });

    it('warns when only the X matcher is missing', () => {
      const { series, warn } = prepSeries(
        SeriesMapping.Manual,
        [{ frame: frameMatcher, y: yMatcher }],
        [frame()],
        fieldConfig
      );

      expect(series).toEqual([]);
      expect(warn).toBe('X field must be mapped');
    });

    it('warns when only the Y matcher is missing', () => {
      const { series, warn } = prepSeries(
        SeriesMapping.Manual,
        [{ frame: frameMatcher, x: xMatcher }],
        [frame()],
        fieldConfig
      );

      expect(series).toEqual([]);
      expect(warn).toBe('Y field must be mapped');
    });

    it('warns when the X matcher does not match a field', () => {
      const { series, warn } = prepSeries(
        SeriesMapping.Manual,
        [{ frame: frameMatcher, x: { matcher: { id: 'byName', options: 'missingX' } }, y: yMatcher }],
        [frame()],
        fieldConfig
      );

      expect(series).toEqual([]);
      expect(warn).toBe('X field not found');
    });

    it('warns when the Y matcher does not match a field', () => {
      const { series, warn } = prepSeries(
        SeriesMapping.Manual,
        [{ frame: frameMatcher, x: xMatcher, y: { matcher: { id: 'byName', options: 'missingY' } } }],
        [frame()],
        fieldConfig
      );

      expect(series).toEqual([]);
      expect(warn).toBe('Y field not found');
    });

    it('leaves warn null when there are no frames so prepConfig can report No data', () => {
      const { series, warn } = prepSeries(SeriesMapping.Manual, [{ frame: frameMatcher }], [], fieldConfig);

      expect(series).toEqual([]);
      expect(warn).toBeNull();
    });

    it('creates a series and does not warn when X and Y are mapped', () => {
      const { series, warn } = prepSeries(
        SeriesMapping.Manual,
        [{ frame: frameMatcher, x: xMatcher, y: yMatcher }],
        [frame()],
        fieldConfig
      );

      expect(series).toHaveLength(1);
      expect(series[0].x.field.name).toBe('x');
      expect(series[0].y.field.name).toBe('y');
      expect(warn).toBeNull();
    });
  });

  describe('color assignment', () => {
    it('assigns a color when no color field or explicit config', () => {
      const frame = makeFrame([
        { name: 'x', values: [1, 2] },
        { name: 'y', values: [10, 20] },
      ]);

      const { series } = prepSeries(SeriesMapping.Auto, [], [frame], fieldConfig);

      expect(series).toHaveLength(1);
      const expectedColor = theme.visualization.getColorByName(theme.visualization.palette[0]);
      expect(series[0].color.fixed).toBe(expectedColor);
    });

    it('assigns fixed color from field config', () => {
      const frame = makeFrame([
        { name: 'x', values: [1, 2] },
        {
          name: 'y',
          values: [10, 20],
          config: {
            color: { mode: FieldColorModeId.Fixed, fixedColor: 'red' },
          },
        },
      ]);

      const { series } = prepSeries(SeriesMapping.Auto, [], [frame], fieldConfig);

      expect(series).toHaveLength(1);
      const expectedColor = theme.visualization.getColorByName('red');
      expect(series[0].color.fixed).toBe(expectedColor);
    });
  });

  describe('size assignment', () => {
    it('assigns size from mapped size field with min/max', () => {
      const frame = makeFrame([
        { name: 'x', values: [1, 2] },
        { name: 'y', values: [10, 20] },
        {
          name: 'sizeField',
          values: [5, 15],
          config: {
            custom: { pointSize: { fixed: 5, min: 2, max: 50 } },
          },
        },
      ]);

      const { series } = prepSeries(
        SeriesMapping.Auto,
        [{ size: { matcher: { id: 'byName', options: 'sizeField' } } }],
        [frame],
        fieldConfig
      );

      expect(series).toHaveLength(1);
      expect(series[0].size.field!.name).toBe('sizeField');
      expect(series[0].size.min).toBe(2);
      expect(series[0].size.max).toBe(50);
    });

    it('assigns fixed size from field config when no size field', () => {
      const frame = makeFrame([
        { name: 'x', values: [1, 2] },
        {
          name: 'y',
          values: [10, 20],
          config: {
            custom: { pointSize: { fixed: 8, min: 1, max: 10 } },
          },
        },
      ]);

      const { series } = prepSeries(SeriesMapping.Auto, [], [frame], fieldConfig);

      expect(series).toHaveLength(1);
      expect(series[0].size.field).toBeUndefined();
      expect(series[0].size.fixed).toBe(8);
    });
  });

  it('includes non-number fields in _rest', () => {
    const frame = makeFrame([
      { name: 'x', values: [1, 2] },
      { name: 'y', values: [10, 20] },
      { name: 'host', type: FieldType.string, values: ['serverA', 'serverB'] },
    ]);

    const { series } = prepSeries(SeriesMapping.Auto, [], [frame], fieldConfig);

    expect(series).toHaveLength(1);
    expect(series[0]._rest.some((f) => f.name === 'host')).toBe(true);
  });

  it('strips common prefix/suffix from series names', () => {
    const frame = makeFrame([
      { name: 'x', values: [1, 2] },
      { name: 'server cpu', values: [10, 20] },
      { name: 'server mem', values: [30, 40] },
    ]);

    const { series } = prepSeries(SeriesMapping.Auto, [], [frame], fieldConfig);

    expect(series).toHaveLength(2);
    expect(series[0].name.value).toBe('cpu');
    expect(series[1].name.value).toBe('mem');
  });
});
