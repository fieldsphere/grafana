import {
  urlUtil,
  structuredLog,
  toLogContextPart
} from '@grafana/data';

interface LogsPermalinkUrlState {
  logs?: {
    id?: string;
  };
}

export function getLogsPanelState(): LogsPermalinkUrlState | undefined {
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
      structuredLog('error', 'error parsing logsPanelState', { error: toLogContextPart(e) });
    }
  }

  return undefined;
}
