import { textUtil } from '@grafana/data';
import { config, createMonitoringLogger } from '@grafana/runtime';

const CSP_REPORT_ONLY_ENABLED = config.cspReportOnlyEnabled;
const logger = createMonitoringLogger('core.trusted-type-policies');

export const defaultTrustedTypesPolicy = {
  createHTML: (string: string, source: string, sink: string) => {
    if (!CSP_REPORT_ONLY_ENABLED) {
      return string.replace(/<script/gi, '&lt;script');
    }
    logger.logWarning('HTML not sanitized with Trusted Types', { source, sink });
    return string;
  },
  createScript: (string: string) => string,
  createScriptURL: (string: string, source: string, sink: string) => {
    if (!CSP_REPORT_ONLY_ENABLED) {
      return textUtil.sanitizeUrl(string);
    }
    logger.logWarning('ScriptURL not sanitized with Trusted Types', { source, sink });
    return string;
  },
};

if (config.trustedTypesDefaultPolicyEnabled && window.trustedTypes && window.trustedTypes.createPolicy) {
  // check if browser supports Trusted Types
  window.trustedTypes.createPolicy('default', defaultTrustedTypesPolicy);
}
