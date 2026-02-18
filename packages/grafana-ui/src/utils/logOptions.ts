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
    const msg = `[Combobox] Items exceed the recommended amount ${recommendedAmount}.`;
    Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'warn'), console, [{ timestamp: new Date().toISOString(), level: 'warn', source: 'packages/grafana-ui/src/utils/logOptions.ts', args: [msg, {
      itemsCount: '' + amount,
      recommendedAmount: '' + recommendedAmount,
      'aria-labelledby': ariaLabelledBy ?? '',
      id: id ?? '',
    }] }]);
  }
}
