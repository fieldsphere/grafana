import { textUtil } from '@grafana/data';
import { config, grafanaStructuredLogger } from '@grafana/runtime';

const CSP_REPORT_ONLY_ENABLED = config.cspReportOnlyEnabled;

export const defaultTrustedTypesPolicy = {
  createHTML: (html: string, source: string, sink: string) => {
    if (!CSP_REPORT_ONLY_ENABLED) {
      return html.replace(/<script/gi, '&lt;script');
    }
    grafanaStructuredLogger.logWarning('[HTML not sanitized with Trusted Types]', {
      sink,
      source,
      snippet: html.slice(0, 160),
    });
    return html;
  },
  createScript: (script: string) => script,
  createScriptURL: (url: string, source: string, sink: string) => {
    if (!CSP_REPORT_ONLY_ENABLED) {
      return textUtil.sanitizeUrl(url);
    }
    grafanaStructuredLogger.logWarning('[ScriptURL not sanitized with Trusted Types]', {
      sink,
      source,
      url,
    });
    return url;
  },
};

if (config.trustedTypesDefaultPolicyEnabled && window.trustedTypes && window.trustedTypes.createPolicy) {
  // check if browser supports Trusted Types
  window.trustedTypes.createPolicy('default', defaultTrustedTypesPolicy);
}
