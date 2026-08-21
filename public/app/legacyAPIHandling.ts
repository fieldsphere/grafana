// Controlled by the `grafana.frontendLegacyAPIHandling` feature flag, monkey-patches
// fetch to log or block calls to legacy /api/ endpoints
import { createStructuredLogger } from '@grafana/data';

const logger = createStructuredLogger('features.app');

export function patchFetchForLegacyAPIMode() {
  const mode = window.__grafanaLegacyAPIMode;
  if (mode !== 'log' && mode !== 'block') {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = input instanceof Request ? input.url : input.toString();
    const url = new URL(rawUrl, window.location.href);
    const isLegacyAPICall = url.origin === window.location.origin && url.pathname.startsWith('/api/');

    if (!isLegacyAPICall) {
      return originalFetch(input, init);
    }

    if (mode === 'block') {
      return Promise.reject(new Error(`Request to legacy api ${url.pathname} blocked`));
    }

    logger.warn(`Request made to legacy api ${url.pathname}`);
    return originalFetch(input, init);
  };
}
