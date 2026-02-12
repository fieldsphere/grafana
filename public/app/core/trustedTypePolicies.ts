import { textUtil } from '@grafana/data';
import { config, createMonitoringLogger } from '@grafana/runtime';

const CSP_REPORT_ONLY_ENABLED = config.cspReportOnlyEnabled;
const logger = createMonitoringLogger('core.trusted-type-policies');

export const defaultTrustedTypesPolicy = {
  createHTML: (string: string, source: string, sink: string) => {
    if (!CSP_REPORT_ONLY_ENABLED) {
      return string.replace(/<script/gi, '&lt;script');
    }
    const warningData = { string, source, sink };
    logger.logWarning('HTML not sanitized with Trusted Types', warningData);
    // Always log to console in report-only mode, regardless of Faro configuration
    console.warn('[Trusted Types] HTML not sanitized', warningData);
    return string;
  },
  createScript: (string: string) => string,
  createScriptURL: (string: string, source: string, sink: string) => {
    if (!CSP_REPORT_ONLY_ENABLED) {
      return textUtil.sanitizeUrl(string);
    }
    const warningData = { string, source, sink };
    logger.logWarning('ScriptURL not sanitized with Trusted Types', warningData);
    // Always log to console in report-only mode, regardless of Faro configuration
    console.warn('[Trusted Types] ScriptURL not sanitized', warningData);
    return string;
  },
};

if (config.trustedTypesDefaultPolicyEnabled && window.trustedTypes && window.trustedTypes.createPolicy) {
  // check if browser supports Trusted Types
  window.trustedTypes.createPolicy('default', defaultTrustedTypesPolicy);
}
