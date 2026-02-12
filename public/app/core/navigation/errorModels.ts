import { NavModel, NavModelItem } from '@grafana/data';
import { createMonitoringLogger } from '@grafana/runtime';

const logger = createMonitoringLogger('core.navigation.error-models');

export function getExceptionNav(error: unknown): NavModel {
  if (error instanceof Error) {
    logger.logError(error, { operation: 'getExceptionNav' });
  } else {
    logger.logWarning('Unexpected exception in navigation model', {
      operation: 'getExceptionNav',
      error: String(error),
    });
  }
  return getWarningNav('Exception thrown', 'See logs for details');
}

export function getNotFoundNav(): NavModel {
  return getWarningNav('Page not found', '404 Error');
}

export function getWarningNav(text: string, subTitle?: string): NavModel {
  const node: NavModelItem = {
    text,
    subTitle,
    icon: 'exclamation-triangle',
  };
  return {
    node: node,
    main: node,
  };
}
