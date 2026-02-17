import { NavModel, NavModelItem } from '@grafana/data';

import { structuredLogFromConsole } from 'app/core/logging/structuredConsole';

export function getExceptionNav(error: unknown): NavModel {
  structuredLogFromConsole('error', error);
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
