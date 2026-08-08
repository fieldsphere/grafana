import { type MuteTimeInterval } from 'app/plugins/datasource/alertmanager/types';

import {
  collapseTimeRangesForForm,
  expandTimeRangesForAlertmanager,
  isValidStartAndEndTime,
  renderTimeIntervals,
} from './util';

describe('isValidStartAndEndTime', () => {
  it('allows empty ranges', () => {
    expect(isValidStartAndEndTime()).toBe(true);
    expect(isValidStartAndEndTime('', '')).toBe(true);
  });

  it('rejects partially filled ranges', () => {
    expect(isValidStartAndEndTime('22:00')).toBe(false);
    expect(isValidStartAndEndTime(undefined, '06:00')).toBe(false);
  });

  it('allows same-day ranges', () => {
    expect(isValidStartAndEndTime('09:00', '17:00')).toBe(true);
  });

  it('allows overnight ranges', () => {
    expect(isValidStartAndEndTime('22:00', '06:00')).toBe(true);
  });

  it('rejects equal start and end times', () => {
    expect(isValidStartAndEndTime('22:00', '22:00')).toBe(false);
  });
});

describe('expandTimeRangesForAlertmanager', () => {
  it('splits overnight ranges for alertmanager', () => {
    expect(expandTimeRangesForAlertmanager([{ start_time: '22:00', end_time: '06:00' }])).toEqual([
      { start_time: '22:00', end_time: '24:00' },
      { start_time: '00:00', end_time: '06:00' },
    ]);
  });

  it('keeps same-day ranges unchanged', () => {
    expect(expandTimeRangesForAlertmanager([{ start_time: '09:00', end_time: '17:00' }])).toEqual([
      { start_time: '09:00', end_time: '17:00' },
    ]);
  });
});

describe('collapseTimeRangesForForm', () => {
  it('merges alertmanager overnight ranges for the form', () => {
    expect(
      collapseTimeRangesForForm([
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
