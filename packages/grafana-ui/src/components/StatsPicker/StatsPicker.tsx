import { difference } from 'lodash';
import { memo, useEffect } from 'react';

import { fieldReducers, SelectableValue, FieldReducerInfo } from '@grafana/data';

import { Select } from '../Select/Select';
import { logUiWarning } from '../../utils/structuredLogging';

export interface Props {
  placeholder?: string;
  onChange: (stats: string[]) => void;
  stats: string[];
  allowMultiple?: boolean;
  defaultStat?: string;
  className?: string;
  width?: number;
  menuPlacement?: 'auto' | 'bottom' | 'top';
  inputId?: string;
  filterOptions?: (ext: FieldReducerInfo) => boolean;
}

export const StatsPicker = memo<Props>(
  ({
    placeholder,
    onChange,
    stats,
    allowMultiple = false,
    defaultStat,
    className,
    width,
    menuPlacement,
    inputId,
    filterOptions,
  }) => {
    useEffect(() => {
      const current = fieldReducers.list(stats);
      if (current.length !== stats.length) {
        const found = current.map((v) => v.id);
        const notFound = difference(stats, found);
        logUiWarning('Unknown stats selected', {
          operation: 'StatsPicker.useEffect',
          unknownStats: notFound.join(','),
          stats: stats.join(','),
        });
        onChange(current.map((stat) => stat.id));
      }

      // Make sure there is only one
      if (!allowMultiple && stats.length > 1) {
        logUiWarning('Removing extra stats because multiple selection is disabled', {
          operation: 'StatsPicker.useEffect',
          stats: stats.join(','),
        });
        onChange([stats[0]]);
      }

      // Set the reducer from callback
      if (defaultStat && stats.length < 1) {
        onChange([defaultStat]);
      }
    }, [stats, allowMultiple, defaultStat, onChange]);

    const onSelectionChange = (item: SelectableValue<string>) => {
      if (Array.isArray(item)) {
        onChange(item.map((v) => v.value));
      } else {
        onChange(item && item.value ? [item.value] : []);
      }
    };

    const select = fieldReducers.selectOptions(stats, filterOptions);
    return (
      <Select
        value={select.current}
        className={className}
        isClearable={!defaultStat}
        isMulti={allowMultiple}
        width={width}
        isSearchable={true}
        options={select.options}
        placeholder={placeholder}
        onChange={onSelectionChange}
        menuPlacement={menuPlacement}
        inputId={inputId}
      />
    );
  }
);

StatsPicker.displayName = 'StatsPicker';
