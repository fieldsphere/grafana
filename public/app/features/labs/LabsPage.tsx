import { useMemo } from 'react';

import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { ScrollContainer, Text } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

export function LabsFeatureFlagsTable() {
  const rows = useMemo(
    () =>
      Object.entries(config.featureToggles)
        .map(([name, enabled]) => ({ name, enabled }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  return (
    <ScrollContainer overflowY="visible" overflowX="auto" width="100%">
      <table className="filter-table">
        <thead>
          <tr>
            <th>
              <Text element="span" weight="bold">
                <Trans i18nKey="labs-page.column-flag">Feature flag</Trans>
              </Text>
            </th>
            <th>
              <Text element="span" weight="bold">
                <Trans i18nKey="labs-page.column-enabled">Enabled</Trans>
              </Text>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.enabled ? t('labs-page.enabled-yes', 'Yes') : t('labs-page.enabled-no', 'No')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollContainer>
  );
}

export default function LabsPage() {
  return (
    <Page navId="labs">
      <Page.Contents>
        <Text element="p">
          <Trans i18nKey="labs-page.description">
            Feature flags enabled for this Grafana instance (from server configuration and runtime evaluation).
          </Trans>
        </Text>
        <LabsFeatureFlagsTable />
      </Page.Contents>
    </Page>
  );
}
