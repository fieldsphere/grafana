export const TTFL_TARGET_MS = 600;
export const TTFL_TARGET_TOLERANCE_MS = 50;

export function mean(samples: number[]): number {
  if (samples.length === 0) {
    throw new Error('mean() requires at least one sample');
  }

  return samples.reduce((sum, value) => sum + value, 0) / samples.length;
}

/** Mean first-load time is on budget when it is at or under 600ms, with 50ms slack. */
export function isWithinTtflBudget(
  meanMs: number,
  targetMs = TTFL_TARGET_MS,
  toleranceMs = TTFL_TARGET_TOLERANCE_MS
): boolean {
  return meanMs <= targetMs + toleranceMs;
}
