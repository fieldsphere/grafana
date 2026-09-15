import {
  type Field,
  formattedValueToString,
  getFieldMatcher,
  FieldType,
  getFieldDisplayName,
  type DataFrame,
  FrameMatcherID,
  type MatcherConfig,
  FieldColorModeId,
  cacheFieldDisplayNames,
  FieldMatcherID,
  type FieldConfigSource,
} from '@grafana/data';
import { decoupleHideFromState } from '@grafana/data/internal';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { VisibilityMode } from '@grafana/schema';

import { XYShowMode, SeriesMapping, type XYSeriesConfig } from './panelcfg.gen';
import { type XYSeries } from './types2';

export interface PrepSeriesResult {
  series: XYSeries[];
  warn: string | null;
}

interface MappingGap {
  unmappedXY: boolean;
  unmappedX: boolean;
  unmappedY: boolean;
  unmappedFrame: boolean;
  missingX: boolean;
  missingY: boolean;
}

function warnForEmptySeries(gap: MappingGap, frames: DataFrame[]): string | null {
  if (gap.unmappedXY || (gap.unmappedX && gap.unmappedY)) {
    return t('xychart.errors.xy-fields-required', 'X and Y fields must be mapped');
  }
  if (gap.unmappedX) {
    return t('xychart.errors.x-field-required', 'X field must be mapped');
  }
  if (gap.unmappedY) {
    return t('xychart.errors.y-field-required', 'Y field must be mapped');
  }
  if (gap.unmappedFrame) {
    return t('xychart.errors.frame-required', 'Frame must be selected');
  }

  const noData = frames.length === 0 || frames.every((frame) => frame.length === 0);
  if (noData) {
    return null;
  }

  if (gap.missingX) {
    return t('xychart.errors.missing-x-field', 'X field not found');
  }
  if (gap.missingY) {
    return t('xychart.errors.missing-y-field', 'Y field not found');
  }

  return t('xychart.errors.could-not-create-series', 'Could not create series from the selected fields');
}

export function fmt(field: Field, val: number): string {
  if (field.display) {
    return formattedValueToString(field.display(val));
  }

  return `${val}`;
}

// cause we dont have a proper matcher for this currently
function getFrameMatcher2(config: MatcherConfig) {
  if (config.id === FrameMatcherID.byIndex) {
    return (frame: DataFrame, index: number) => index === config.options;
  }

  return () => false;
}

export function prepSeries(
  mapping: SeriesMapping,
  mappedSeries: XYSeriesConfig[],
  frames: DataFrame[],
  fieldConfig: FieldConfigSource
): PrepSeriesResult {
  cacheFieldDisplayNames(frames);
  decoupleHideFromState(frames, fieldConfig);

  let series: XYSeries[] = [];
  const gap: MappingGap = {
    unmappedXY: false,
    unmappedX: false,
    unmappedY: false,
    unmappedFrame: false,
    missingX: false,
    missingY: false,
  };

  if (mappedSeries.length === 0) {
    mappedSeries = [{}];
  }

  const { palette, getColorByName } = config.theme2.visualization;

  mappedSeries.forEach((seriesCfg, seriesIdx) => {
    if (mapping === SeriesMapping.Manual) {
      const hasX = seriesCfg.x?.matcher != null;
      const hasY = seriesCfg.y?.matcher != null;
      const hasFrame = seriesCfg.frame?.matcher != null;

      if (!hasX && !hasY) {
        gap.unmappedXY = true;
        return;
      }
      if (!hasX) {
        gap.unmappedX = true;
        return;
      }
      if (!hasY) {
        gap.unmappedY = true;
        return;
      }
      if (!hasFrame) {
        gap.unmappedFrame = true;
        return;
      }
    }

    let xMatcher = getFieldMatcher(
      seriesCfg.x?.matcher ?? {
        id: FieldMatcherID.byType,
        options: 'number',
      }
    );
    let yMatcher = getFieldMatcher(
      seriesCfg.y?.matcher ?? {
        id: FieldMatcherID.byType,
        options: 'number',
      }
    );
    let colorMatcher = seriesCfg.color ? getFieldMatcher(seriesCfg.color.matcher) : null;
    let sizeMatcher = seriesCfg.size ? getFieldMatcher(seriesCfg.size.matcher) : null;
    // let frameMatcher = seriesCfg.frame ? getFrameMatchers(seriesCfg.frame) : null;
    let frameMatcher = seriesCfg.frame ? getFrameMatcher2(seriesCfg.frame.matcher) : null;

    // loop over all frames and fields, adding a new series for each y dim
    frames.forEach((frame, frameIdx) => {
      // must match frame in manual mode
      if (frameMatcher != null && !frameMatcher(frame, frameIdx)) {
        return;
      }

      // shared across each series in this frame
      let restFields: Field[] = [];

      let frameSeries: XYSeries[] = [];

      let onlyNumTimeFields = frame.fields.filter(
        (field) => field.type === FieldType.number || field.type === FieldType.time
      );

      // only one of these per frame
      let x = onlyNumTimeFields.find((field) => xMatcher(field, frame, frames));

      // only grabbing number fields (exclude time, string, enum, other)
      let onlyNumFields = onlyNumTimeFields.filter((field) => field.type === FieldType.number);

      let color = colorMatcher != null ? onlyNumFields.find((field) => colorMatcher(field, frame, frames)) : undefined;
      let size = sizeMatcher != null ? onlyNumFields.find((field) => sizeMatcher(field, frame, frames)) : undefined;

      // x field is required
      if (x != null) {
        // match y fields and create series
        onlyNumFields.forEach((field) => {
          if (field === x) {
            return;
          }

          // in auto mode don't reuse already-mapped fields
          if (mapping === SeriesMapping.Auto && (field === color || field === size)) {
            return;
          }

          // in manual mode only add single series for this config
          if (mapping === SeriesMapping.Manual && frameSeries.length > 0) {
            return;
          }

          // if we match non-excluded y, create series
          if (yMatcher(field, frame, frames) && !field.config.custom?.hideFrom?.viz) {
            let y = field;
            let name = seriesCfg.name?.fixed ?? getFieldDisplayName(y, frame, frames);

            let ser: XYSeries = {
              // these typically come from y field
              name: {
                value: name,
              },

              showPoints: y.config.custom.show === XYShowMode.Lines ? VisibilityMode.Never : VisibilityMode.Always,
              pointShape: y.config.custom.pointShape,
              pointStrokeWidth: y.config.custom.pointStrokeWidth,
              fillOpacity: y.config.custom.fillOpacity,

              showLine: y.config.custom.show !== XYShowMode.Points,
              lineWidth: y.config.custom.lineWidth ?? 2,
              lineStyle: y.config.custom.lineStyle,

              x: {
                field: x!,
              },
              y: {
                field: y,
              },
              color: {},
              size: {},
              _rest: restFields,
            };

            if (color != null) {
              ser.color.field = color;
            }

            if (size != null) {
              ser.size.field = size;
              ser.size.min = size.config.custom.pointSize?.min ?? 5;
              ser.size.max = size.config.custom.pointSize?.max ?? 100;
              // ser.size.mode =
            }

            frameSeries.push(ser);
          }
        });

        if (frameSeries.length === 0) {
          gap.missingY = true;
        }

        // populate rest fields
        frame.fields.forEach((field) => {
          let isUsedField = frameSeries.some(
            ({ x, y, color, size }) =>
              x.field === field || y.field === field || color.field === field || size.field === field
          );

          if (!isUsedField) {
            restFields.push(field);
          }
        });

        series.push(...frameSeries);
      } else {
        gap.missingX = true;
      }
    });
  });

  if (series.length === 0) {
    return { series, warn: warnForEmptySeries(gap, frames) };
  }

  // assign classic palette colors by index, as fallbacks for all series

  let paletteIdx = 0;

  // todo: populate min, max, mode from field + hints
  series.forEach((s, i) => {
    if (s.color.field == null) {
      // derive fixed color from y field config
      let colorCfg = s.y.field.config.color ?? { mode: FieldColorModeId.PaletteClassic };

      let value = '';

      if (colorCfg.mode === FieldColorModeId.PaletteClassic) {
        value = getColorByName(palette[paletteIdx++ % palette.length]); // todo: do this via state.seriesIdx and re-init displayProcessor
      } else if (colorCfg.mode === FieldColorModeId.Fixed) {
        value = getColorByName(colorCfg.fixedColor!);
      }

      s.color.fixed = value;
    }

    if (s.size.field == null) {
      // derive fixed size from y field config
      s.size.fixed = s.y.field.config.custom.pointSize?.fixed ?? 5;
      // ser.size.mode =
    }
  });

  autoNameSeries(series);

  // TODO: re-assign y display names?
  // y.state = {
  //   ...y.state,
  //   seriesIndex: series.length + ,
  // };
  // y.display = getDisplayProcessor({ field, theme });

  return { series, warn: null };
}

// strip common prefixes and suffixes from y field names
function autoNameSeries(series: XYSeries[]) {
  let names = series.map((s) => s.name.value.split(/\s+/g));

  const { prefix, suffix } = findCommonPrefixSuffixLengths(names);

  if (prefix < Infinity || suffix < Infinity) {
    series.forEach((s, i) => {
      s.name.value = names[i].slice(prefix, names[i].length - suffix).join(' ');
    });
  }
}

export function getCommonPrefixSuffix(strs: string[]) {
  let names = strs.map((s) => s.split(/\s+/g));

  let { prefix, suffix } = findCommonPrefixSuffixLengths(names);

  let n = names[0];

  if (n.length === 1 && prefix === 1 && suffix === 1) {
    return '';
  }

  let parts = [];

  if (prefix > 0) {
    parts.push(...n.slice(0, prefix));
  }

  if (suffix > 0) {
    parts.push(...n.slice(-suffix));
  }

  return parts.join(' ');
}

// lengths are in number of tokens (segments) in a phrase
function findCommonPrefixSuffixLengths(names: string[][]) {
  let commonPrefixLen = Infinity;
  let commonSuffixLen = Infinity;

  // if auto naming strategy, rename fields by stripping common prefixes and suffixes
  let segs0: string[] = names[0];

  for (let i = 1; i < names.length; i++) {
    if (names[i].length < segs0.length) {
      segs0 = names[i];
    }
  }

  for (let i = 1; i < names.length; i++) {
    let segs = names[i];

    if (segs !== segs0) {
      // prefixes
      let preLen = 0;
      for (let j = 0; j < segs0.length; j++) {
        if (segs[j] === segs0[j]) {
          preLen++;
        } else {
          break;
        }
      }

      if (preLen < commonPrefixLen) {
        commonPrefixLen = preLen;
      }

      // suffixes
      let sufLen = 0;
      for (let j = segs0.length - 1; j >= 0; j--) {
        if (segs[j] === segs0[j]) {
          sufLen++;
        } else {
          break;
        }
      }

      if (sufLen < commonSuffixLen) {
        commonSuffixLen = sufLen;
      }
    }
  }

  return {
    prefix: commonPrefixLen,
    suffix: commonSuffixLen,
  };
}
