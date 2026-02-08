import { createLogger } from './logger';

const logger = createLogger('grafana-ui.logOptions');

/**
 * This function logs a warning if the amount of items exceeds the recommended amount.
 *
 * @param amount
 * @param id
 * @param ariaLabelledBy
 */
export function logOptions(
  amount: number,
  recommendedAmount: number,
  id: string | undefined,
  ariaLabelledBy: string | undefined
): void {
  if (amount > recommendedAmount) {
    const msg = `Items exceed the recommended amount ${recommendedAmount}.`;
    logger.warn(msg, {
      itemsCount: '' + amount,
      recommendedAmount: '' + recommendedAmount,
      'aria-labelledby': ariaLabelledBy ?? '',
      id: id ?? '',
    });
  }
}
