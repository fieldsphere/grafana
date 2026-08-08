import { type MuteTimeInterval } from 'app/plugins/datasource/alertmanager/types';

import { isValidStartAndEndTime, renderTimeIntervals } from './util';

describe('isValidStartAndEndTime', () => {
  it('allows empty time ranges', () => {
    expect(isValidStartAndEndTime()).toBe(true);
    expect(isValidStartAndEndTime('', '')).toBe(true);
  });

  it('rejects partially filled time ranges', () => {
    expect(isValidStartAndEndTime('22:00')).toBe(false);
    expect(isValidStartAndEndTime(undefined, '06:00')).toBe(false);
  });

  it('allows same-day time ranges', () => {
    expect(isValidStartAndEndTime('09:00', '17:00')).toBe(true);
  });

  it('allows overnight time ranges', () => {
    expect(isValidStartAndEndTime('22:00', '06:00')).toBe(true);
  });

  it('rejects equal start and end times', () => {
    expect(isValidStartAndEndTime('22:00', '22:00')).toBe(false);
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
