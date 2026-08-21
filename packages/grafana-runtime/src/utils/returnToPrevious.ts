import { createStructuredLogger } from '@grafana/data';

const logger = createStructuredLogger('grafana/runtime');

type ReturnToPreviousHook = () => (title: string, href?: string) => void;

let rtpHook: ReturnToPreviousHook | undefined = undefined;

export const setReturnToPreviousHook = (hook: ReturnToPreviousHook) => {
  rtpHook = hook;
};

/**
 * Guidelines:
 * - Only use the ‘Return to previous’ functionality when the user is sent to another context, such as from Alerting to a dashboard.
 * - Specify a button title that identifies the page to return to in the most understandable way. Do not use text such as ‘Back to the previous page’. Be specific.
 */
export const useReturnToPrevious: ReturnToPreviousHook = () => {
  if (!rtpHook) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('useReturnToPrevious hook not found in @grafana/runtime');
    }
    return () => logger.error('ReturnToPrevious hook not found');
  }

  return rtpHook();
};
