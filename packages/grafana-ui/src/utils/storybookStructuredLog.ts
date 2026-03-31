/**
 * Structured one-line logs for Storybook demos (avoid raw console.log).
 */
export function storyStructuredInfo(source: string, message: string, context?: Record<string, unknown>): void {
  // eslint-disable-next-line no-console
  console.info(
    JSON.stringify({
      level: 'INFO',
      source,
      message,
      timestamp: Date.now(),
      ...context,
    })
  );
}
