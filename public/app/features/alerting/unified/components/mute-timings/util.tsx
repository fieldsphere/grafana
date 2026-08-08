import moment from 'moment';
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

export const isValidStartAndEndTime = (startTime?: string, endTime?: string): boolean => {
  // empty time range is perfectly valid for a mute timing
  if (!startTime && !endTime) {
    return true;
  }

  if ((!startTime && endTime) || (startTime && !endTime)) {
    return false;
  }

  const timeUnit = 'HH:mm';
  // @ts-ignore typescript types here incorrect, sigh
  const startDate = moment().startOf('day').add(startTime, timeUnit);
  // @ts-ignore typescript types here incorrect, sigh
  const endDate = moment().startOf('day').add(endTime, timeUnit);

  // Reject zero-length intervals; same-day (start < end) and overnight (start > end) are valid.
  return !startDate.isSame(endDate);
};

export const timeStringToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Alertmanager time ranges must have start < end within a single day.
 * Overnight ranges (e.g. 22:00–06:00) are expanded into two same-day ranges.
 */
export const expandTimeRangesForAlertmanager = (times: TimeRange[]): TimeRange[] => {
  const expanded: TimeRange[] = [];

  for (const { start_time, end_time } of times) {
    if (!start_time || !end_time) {
      continue;
    }

    const startMinutes = timeStringToMinutes(start_time);
    const endMinutes = timeStringToMinutes(end_time);

    if (startMinutes === endMinutes) {
      continue;
    }

    if (startMinutes < endMinutes) {
      expanded.push({ start_time, end_time });
      continue;
    }

    // Overnight range: split at midnight for Alertmanager compatibility.
    expanded.push({ start_time, end_time: '24:00' });
    expanded.push({ start_time: '00:00', end_time });
  }

  return expanded;
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
