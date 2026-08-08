import { createMuteTiming } from './mute-timings';

describe('createMuteTiming', () => {
  it('expands overnight time ranges when saving', () => {
    const result = createMuteTiming({
      name: 'overnight',
      time_intervals: [
        {
          times: [{ start_time: '22:00', end_time: '06:00' }],
          weekdays: '',
          days_of_month: '',
          months: '',
          years: '',
          location: '',
          disable: false,
        },
      ],
    });

    expect(result.time_intervals[0].times).toEqual([
      { start_time: '22:00', end_time: '24:00' },
      { start_time: '00:00', end_time: '06:00' },
    ]);
  });
});
