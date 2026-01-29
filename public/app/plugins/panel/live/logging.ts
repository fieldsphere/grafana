import { createMonitoringLogger } from '@grafana/runtime';
import { createLogger } from '@grafana/ui';

/**
 * Shared loggers for the live panel plugin.
 * Used by LivePanel and LivePublish components.
 */
export const livePanelLogger = createMonitoringLogger('plugins.panel.live');
export const livePanelDebugLogger = createLogger('plugins.panel.live');
