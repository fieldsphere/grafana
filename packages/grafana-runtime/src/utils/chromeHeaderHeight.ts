import { runtimeHookLogger } from './runtimeHooksLogging';

type ChromeHeaderHeightHook = () => number;

let chromeHeaderHeightHook: ChromeHeaderHeightHook | undefined = undefined;

export const setChromeHeaderHeightHook = (hook: ChromeHeaderHeightHook) => {
  chromeHeaderHeightHook = hook;
};

export const useChromeHeaderHeight = () => {
  if (!chromeHeaderHeightHook) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('useChromeHeaderHeight hook not found in @grafana/runtime');
    }
    runtimeHookLogger.logError(new Error('useChromeHeaderHeight hook not found'));
  }

  return chromeHeaderHeightHook?.();
};
