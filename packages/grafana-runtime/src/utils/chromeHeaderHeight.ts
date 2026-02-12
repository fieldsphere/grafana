import { config } from '../config';
import { createMonitoringLogger } from './logging';

type ChromeHeaderHeightHook = () => number;

let chromeHeaderHeightHook: ChromeHeaderHeightHook | undefined = undefined;
const logger = createMonitoringLogger('runtime.chrome-header-height');

export const setChromeHeaderHeightHook = (hook: ChromeHeaderHeightHook) => {
  chromeHeaderHeightHook = hook;
};

export const useChromeHeaderHeight = () => {
  if (!chromeHeaderHeightHook) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('useChromeHeaderHeight hook not found in @grafana/runtime');
    }
    logger.logWarning('useChromeHeaderHeight hook not found');
    if (!config.grafanaJavascriptAgent.enabled) {
      console.error('useChromeHeaderHeight hook not found');
    }
  }

  return chromeHeaderHeightHook?.();
};
