import { createMuteTiming } from './mute-timings';

describe('createMuteTiming', () => {
  it('splits overnight time ranges when saving', () => {
    const muteTiming = createMuteTiming({
      name: 'overnight maintenance',
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

    expect(muteTiming.time_intervals[0].times).toEqual([
      { start_time: '22:00', end_time: '24:00' },
      { start_time: '00:00', end_time: '06:00' },
    ]);
  });
});
