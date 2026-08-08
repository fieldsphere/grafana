import { Fragment } from 'react';

import { Stack } from '@grafana/ui';
import {
  type AlertmanagerConfig,
  type MuteTimeInterval,
  type TimeRange,
} from 'app/plugins/datasource/alertmanager/types';

import {
  getDaysOfMonthString,
  getMonthsString,
  getTimeString,
  getWeekdayString,
  getYearsString,
} from '../../utils/alertmanager';

// https://github.com/prometheus/alertmanager/blob/9de8ef36755298a68b6ab20244d4369d38bdea99/timeinterval/timeinterval.go#L443
const TIME_RANGE_REGEX = /^((([01][0-9])|(2[0-3])):[0-5][0-9])$|(^24:00$)/;

export const isvalidTimeFormat = (timeString: string): boolean => {
  return timeString ? TIME_RANGE_REGEX.test(timeString) : true;
};

/**
 * Merges `mute_time_intervals` and `time_intervals` from alertmanager config to support both old and new config
 */
export const mergeTimeIntervals = (alertManagerConfig: AlertmanagerConfig) => {
  return [...(alertManagerConfig.mute_time_intervals ?? []), ...(alertManagerConfig.time_intervals ?? [])];
};

const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map((value) => parseInt(value, 10));
  return hours * 60 + minutes;
};

export const isValidStartAndEndTime = (startTime?: string, endTime?: string): boolean => {
  // empty time range is perfectly valid for a mute timing
  if (!startTime && !endTime) {
    return true;
  }

  if ((!startTime && endTime) || (startTime && !endTime)) {
    return false;
  }

  // Same-day (start < end) and overnight (start > end) are valid. Equal times are not.
  return parseTimeToMinutes(startTime!) !== parseTimeToMinutes(endTime!);
};

/**
 * Alertmanager requires start < end within a single time range. Overnight ranges (e.g. 22:00–06:00)
 * are expanded into two same-day ranges.
 */
export const expandTimeRangesForAlertmanager = (times: TimeRange[]): TimeRange[] => {
  const expanded: TimeRange[] = [];

  for (const { start_time, end_time } of times) {
    if (!start_time || !end_time) {
      continue;
    }

    const start = parseTimeToMinutes(start_time);
    const end = parseTimeToMinutes(end_time);

    if (start === end) {
      continue;
    }

    if (start < end) {
      expanded.push({ start_time, end_time });
      continue;
    }

    expanded.push({ start_time, end_time: '24:00' });
    expanded.push({ start_time: '00:00', end_time });
  }

  return expanded;
};

/**
 * Collapse adjacent 24:00 / 00:00 ranges back into a single overnight range for the form.
 */
export const collapseTimeRangesForForm = (times?: TimeRange[]): TimeRange[] | undefined => {
  if (!times?.length) {
    return times;
  }

  const collapsed: TimeRange[] = [];

  for (let i = 0; i < times.length; i++) {
    const current = times[i];
    const next = times[i + 1];

    if (
      next &&
      current.end_time === '24:00' &&
      next.start_time === '00:00' &&
      parseTimeToMinutes(current.start_time) > parseTimeToMinutes(next.end_time)
    ) {
      collapsed.push({ start_time: current.start_time, end_time: next.end_time });
      i++;
      continue;
    }

    collapsed.push(current);
  }

  return collapsed;
};

export function renderTimeIntervals(muteTiming: MuteTimeInterval) {
  const timeIntervals = muteTiming.time_intervals;

  const intervals = timeIntervals.map((interval, index) => {
    const { times, weekdays, days_of_month, months, years, location } = interval;
    const timeString = getTimeString(times, location);
    const weekdayString = getWeekdayString(weekdays);
    const daysString = getDaysOfMonthString(days_of_month);
    const monthsString = getMonthsString(months);
    const yearsString = getYearsString(years);

    return (
      <Fragment key={JSON.stringify(interval) + index}>
        <div>
          {`${timeString} ${weekdayString}`}
          <br />
          {[daysString, monthsString, yearsString].join(' | ')}
          <br />
        </div>
      </Fragment>
    );
  });

  return (
    <Stack direction="column" gap={1}>
      {intervals}
    </Stack>
  );
}
