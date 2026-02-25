import { NavModel, NavModelItem } from '@grafana/data';

import { coreLogger } from 'app/core/utils/structuredLogger';

export function getExceptionNav(error: unknown): NavModel {
  coreLogger.error(error instanceof Error ? error : String(error), { context: 'getExceptionNav' });
  return getWarningNav('Exception thrown', 'See console for details');
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
