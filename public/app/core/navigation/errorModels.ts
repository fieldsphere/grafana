import {type NavModel, type NavModelItem, createClientLog} from '@grafana/data';
const clientLog = createClientLog('public/app/core/navigation/errorModels');



export function getExceptionNav(error: unknown): NavModel {
  clientLog.error(error);
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
