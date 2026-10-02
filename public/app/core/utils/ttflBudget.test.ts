import { isWithinTtflBudget, mean, TTFL_TARGET_MS } from './ttflBudget';

describe('ttflBudget', () => {
  describe('mean', () => {
    it('returns the arithmetic mean of the samples', () => {
      expect(mean([500, 600, 700])).toBe(600);
    });

    it('throws when given no samples', () => {
      expect(() => mean([])).toThrow('mean() requires at least one sample');
    });
  });

  describe('isWithinTtflBudget', () => {
    it('accepts a mean at the 600ms target', () => {
      expect(isWithinTtflBudget(TTFL_TARGET_MS)).toBe(true);
    });

    it('accepts a mean 50ms over the target', () => {
      expect(isWithinTtflBudget(650)).toBe(true);
    });

    it('rejects a mean above the slack window', () => {
      expect(isWithinTtflBudget(651)).toBe(false);
    });

    it('accepts a mean faster than the target', () => {
      expect(isWithinTtflBudget(180)).toBe(true);
    });
  });
});
