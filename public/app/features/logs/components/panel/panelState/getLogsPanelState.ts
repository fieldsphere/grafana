import { urlUtil } from '@grafana/data';

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
      Reflect.apply(Reflect.get(globalThis, '__structuredLog') ?? Reflect.get(console, 'error'), console, [{ timestamp: new Date().toISOString(), level: 'error', source: 'public/app/features/logs/components/panel/panelState/getLogsPanelState.ts', args: ['error parsing logsPanelState', e] }]);
    }
  }

  return undefined;
}
