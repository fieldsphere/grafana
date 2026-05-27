import { structuredConsoleLog } from './structuredConsole';

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
    structuredConsoleLog('error', 'useChromeHeaderHeight hook not found', {
      source: 'useChromeHeaderHeight',
    });
  }

  return chromeHeaderHeightHook?.();
};
