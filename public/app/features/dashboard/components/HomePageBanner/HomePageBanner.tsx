import { t } from '@grafana/i18n';
import { Alert } from '@grafana/ui';

export function HomePageBanner() {
  return (
    <Alert
      title={t('dashboard.home-page-banner.title', 'Welcome home')}
      severity="info"
      style={{ flex: 0 }}
    >
      {t(
        'dashboard.home-page-banner.body',
        'This banner appears only on the Grafana home dashboard.'
      )}
    </Alert>
  );
}
