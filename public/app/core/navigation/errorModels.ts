import { type NavModel, type NavModelItem, createStructuredLogger } from '@grafana/data';

const logger = createStructuredLogger('features.core');

export function getExceptionNav(error: unknown): NavModel {
  logger.error(error);
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
