import { createStructuredLogger } from '@grafana/data';

const logger = createStructuredLogger('grafana/ui');

/**
 * This function logs a warning if the amount of items exceeds the recommended amount.
 */
export function logOptions(
  amount: number,
  recommendedAmount: number,
  id: string | undefined,
  ariaLabelledBy: string | undefined
): void {
  if (amount > recommendedAmount) {
    const msg = `[Combobox] Items exceed the recommended amount ${recommendedAmount}.`;
    logger.warn(msg, {
      itemsCount: '' + amount,
      recommendedAmount: '' + recommendedAmount,
      'aria-labelledby': ariaLabelledBy ?? '',
      id: id ?? '',
    });
  }
}
