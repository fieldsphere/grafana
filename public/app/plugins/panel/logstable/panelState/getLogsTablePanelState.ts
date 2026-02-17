import { urlUtil } from '@grafana/data';
import { createMonitoringLogger } from '@grafana/runtime';

const logger = createMonitoringLogger('plugins.panel.logstable.panel-state');

interface LogsPermalinkUrlState {
  logs?: {
    id?: string;
  };
}

// @todo DRY with app/plugins/panel/logs/LogsPanel.tsx
export function getLogsTablePanelState(): LogsPermalinkUrlState | undefined {
  const urlParams = urlUtil.getUrlSearchParams();
  const panelStateEncoded = urlParams?.panelState;
  if (
    panelStateEncoded &&
    Array.isArray(panelStateEncoded) &&
    panelStateEncoded?.length > 0 &&
    typeof panelStateEncoded[0] === 'string'
  ) {
    try {
      return JSON.parse(panelStateEncoded[0]);
    } catch (e) {
      if (e instanceof Error) {
        logger.logError(e, { operation: 'getLogsTablePanelState' });
      } else {
        logger.logWarning('Error parsing logs panel state', {
          operation: 'getLogsTablePanelState',
          error: String(e),
        });
      }
    }
  }

  return undefined;
}
