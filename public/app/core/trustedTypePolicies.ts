import { structLog } from '@grafana/data';
import { textUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
const CSP_REPORT_ONLY_ENABLED = config.cspReportOnlyEnabled;
export const defaultTrustedTypesPolicy = {
  createHTML: (string: string, source: string, sink: string) => {
    if (!CSP_REPORT_ONLY_ENABLED) {
      return string.replace(/<script/gi, '&lt;script');
    }
    structLog('error', '[HTML not sanitized with Trusted Types]', string, source, sink);
    return string;
  },
  createScript: (string: string) => string,
  createScriptURL: (string: string, source: string, sink: string) => {
    if (!CSP_REPORT_ONLY_ENABLED) {
      return textUtil.sanitizeUrl(string);
    }
    structLog('error', '[ScriptURL not sanitized with Trusted Types]', string, source, sink);
    return string;
  },
};
if (config.trustedTypesDefaultPolicyEnabled && window.trustedTypes && window.trustedTypes.createPolicy) {
  // check if browser supports Trusted Types
  window.trustedTypes.createPolicy('default', defaultTrustedTypesPolicy);
}
