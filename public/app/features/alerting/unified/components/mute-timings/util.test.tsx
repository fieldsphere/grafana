import { type MuteTimeInterval } from 'app/plugins/datasource/alertmanager/types';

import {
  collapseOvernightTimeRanges,
  expandOvernightTimeRange,
  isValidStartAndEndTime,
  parseTimeToMinutes,
  renderTimeIntervals,
} from './util';

describe('parseTimeToMinutes', () => {
  it('parses valid times', () => {
    expect(parseTimeToMinutes('22:00')).toBe(22 * 60);
    expect(parseTimeToMinutes('24:00')).toBe(24 * 60);
  });

  it('returns null for invalid times', () => {
    expect(parseTimeToMinutes('25:00')).toBeNull();
    expect(parseTimeToMinutes('invalid')).toBeNull();
  });
});

describe('isValidStartAndEndTime', () => {
  it('allows empty ranges', () => {
    expect(isValidStartAndEndTime()).toBe(true);
    expect(isValidStartAndEndTime('', '')).toBe(true);
  });

  it('allows same-day ranges', () => {
    expect(isValidStartAndEndTime('09:00', '17:00')).toBe(true);
  });

  it('allows overnight ranges', () => {
    expect(isValidStartAndEndTime('22:00', '06:00')).toBe(true);
  });

  it('rejects equal start and end', () => {
    expect(isValidStartAndEndTime('12:00', '12:00')).toBe(false);
  });

  it('rejects partial ranges', () => {
    expect(isValidStartAndEndTime('12:00', undefined)).toBe(false);
    expect(isValidStartAndEndTime(undefined, '12:00')).toBe(false);
  });
});

describe('expandOvernightTimeRange', () => {
  it('splits overnight ranges for alertmanager', () => {
    expect(expandOvernightTimeRange({ start_time: '22:00', end_time: '06:00' })).toEqual([
      { start_time: '22:00', end_time: '24:00' },
      { start_time: '00:00', end_time: '06:00' },
    ]);
  });

  it('keeps same-day ranges unchanged', () => {
    expect(expandOvernightTimeRange({ start_time: '09:00', end_time: '17:00' })).toEqual([
      { start_time: '09:00', end_time: '17:00' },
    ]);
  });

  it('maps until-midnight to end of day', () => {
    expect(expandOvernightTimeRange({ start_time: '22:00', end_time: '00:00' })).toEqual([
      { start_time: '22:00', end_time: '24:00' },
    ]);
  });
});

describe('collapseOvernightTimeRanges', () => {
  it('merges split overnight ranges for the form', () => {
    expect(
      collapseOvernightTimeRanges([
        { start_time: '22:00', end_time: '24:00' },
        { start_time: '00:00', end_time: '06:00' },
      ])
    ).toEqual([{ start_time: '22:00', end_time: '06:00' }]);
  });
});

describe('renderTimeIntervals', () => {
  it('should render empty time interval', () => {
    const muteTiming: MuteTimeInterval = {
      name: 'test',
      time_intervals: [],
    };

    expect(renderTimeIntervals(muteTiming)).toMatchSnapshot();
  });

  it('should render time interval with time range', () => {
    const muteTiming: MuteTimeInterval = {
      name: 'test',
      time_intervals: [
        {
          times: [
            {
              start_time: '12:00',
              end_time: '13:00',
            },
            {
              start_time: '14:00',
              end_time: '15:00',
            },
          ],
        },
      ],
    };

    expect(renderTimeIntervals(muteTiming)).toMatchSnapshot();
  });

  it('should render time interval with weekdays', () => {
    const muteTiming: MuteTimeInterval = {
      name: 'test',
      time_intervals: [
        {
          weekdays: ['monday', 'tuesday:thursday', 'sunday'],
        },
      ],
    };

    expect(renderTimeIntervals(muteTiming)).toMatchSnapshot();
  });

  it('should render time interval with kitchen sink', () => {
    const interval = {
      weekdays: ['monday', 'tuesday:thursday', 'sunday'],
      times: [
        {
          start_time: '12:00',
          end_time: '13:00',
        },
        {
          start_time: '14:00',
          end_time: '15:00',
        },
      ],
      days_of_month: ['1', '2:4', '31'],
      location: 'Europe/Berlin',
      months: ['january', 'february:march', 'december'],
      years: ['2019', '2020:2021'],
    };

    const muteTiming: MuteTimeInterval = {
      name: 'test',
      time_intervals: [interval, interval],
    };

    expect(renderTimeIntervals(muteTiming)).toMatchSnapshot();
  });
});
