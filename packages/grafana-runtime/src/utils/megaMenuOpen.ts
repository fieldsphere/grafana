import { config } from '../config';
import { createMonitoringLogger } from './logging';

type MegaMenuOpenHook = () => Readonly<[boolean, (open: boolean, persist?: boolean) => void]>;

let megaMenuOpenHook: MegaMenuOpenHook | undefined = undefined;
const logger = createMonitoringLogger('runtime.mega-menu-open');

export const setMegaMenuOpenHook = (hook: MegaMenuOpenHook) => {
  megaMenuOpenHook = hook;
};

/**
 * Guidelines:
 * - Should only be used in very specific circumstances where the mega menu needs to be opened or closed programmatically.
 */
export const useMegaMenuOpen: MegaMenuOpenHook = () => {
  if (!megaMenuOpenHook) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('useMegaMenuOpen hook not found in @grafana/runtime');
    }
    return [
      false,
      (open: boolean, persist?: boolean) => {
        logger.logWarning('MegaMenuOpen hook not found', { open, persist });
        if (!config.grafanaJavascriptAgent.enabled) {
          console.error('MegaMenuOpen hook not found', { open, persist });
        }
      },
    ];
  }

  return megaMenuOpenHook();
};
