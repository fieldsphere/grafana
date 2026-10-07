import { createStructuredLogger } from '@grafana/data';
import { config } from '@grafana/runtime';

import { enforcingTrustedTypesPolicy } from './trustedTypesPolicy';

const structuredLogger = createStructuredLogger('features.core', { remote: false });
const CSP_REPORT_ONLY_ENABLED = config.cspReportOnlyEnabled;

export const defaultTrustedTypesPolicy = {
  createHTML: (string: string, source: string, sink: string) => {
    if (!CSP_REPORT_ONLY_ENABLED) {
      return enforcingTrustedTypesPolicy.createHTML(string);
    }
    structuredLogger.error('[HTML not sanitized with Trusted Types]', string, source, sink);
    return string;
  },
  createScript: enforcingTrustedTypesPolicy.createScript,
  createScriptURL: (string: string, source: string, sink: string) => {
    if (!CSP_REPORT_ONLY_ENABLED) {
      return enforcingTrustedTypesPolicy.createScriptURL(string);
    }
    structuredLogger.error('[ScriptURL not sanitized with Trusted Types]', string, source, sink);
    return string;
  },
};

if (config.trustedTypesDefaultPolicyEnabled && window.trustedTypes && window.trustedTypes.createPolicy) {
  // check if browser supports Trusted Types
  window.trustedTypes.createPolicy('default', defaultTrustedTypesPolicy);
}
