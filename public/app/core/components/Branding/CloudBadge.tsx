import { t } from '@grafana/i18n';

import { OrangeBadge } from './OrangeBadge';

export function CloudBadge() {
  return (
    <OrangeBadge
      variant="environment"
      text={t('cloud-environment-badge', 'Environment: Cloud')}
      title={t('cloud-environment-badge-title', 'This product is running in the Cloud environment')}
    />
  );
}
