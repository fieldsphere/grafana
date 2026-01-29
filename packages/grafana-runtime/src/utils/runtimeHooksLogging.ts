import { createMonitoringLogger } from './logging';

/**
 * Shared logger for runtime hooks utilities.
 * Used by chromeHeaderHeight, megaMenuOpen, and returnToPrevious hooks.
 */
export const runtimeHookLogger = createMonitoringLogger('runtime.hooks');
