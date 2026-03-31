import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { Alert, Badge, FilterInput, HorizontalGroup, Stack, Text } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { FeatureToggle, getFeatureToggles } from './labsApi';

export default function LabsPage() {
  const [query, setQuery] = useState('');
  const { loading, error, value } = useAsync(() => getFeatureToggles(), []);

  const filteredToggles = useMemo(() => {
    const toggles = value?.toggles ?? [];
    const search = query.trim().toLowerCase();

    if (!search) {
      return toggles;
    }

    return toggles.filter((toggle) => {
      return (
        toggle.name.toLowerCase().includes(search) ||
        (toggle.description ?? '').toLowerCase().includes(search) ||
        toggle.stage.toLowerCase().includes(search)
      );
    });
  }, [query, value]);

  return (
    <Page navId="labs" subTitle="Review all Grafana feature flags and whether they are currently enabled.">
      <Page.Contents>
        <Stack gap={3}>
          <Alert severity="info" title="Labs feature flags">
            This page is read-only and reflects the current resolved state of Grafana feature flags for this instance.
          </Alert>

          <Stack direction="row" justifyContent="space-between" alignItems="center" wrap>
            <FilterInput
              value={query}
              onChange={setQuery}
              escapeRegex={false}
              width={40}
              placeholder="Filter feature flags"
            />
            {value && (
              <Text color="secondary">
                Showing {filteredToggles.length} of {value.toggles.length} flags
              </Text>
            )}
          </Stack>

          {error && (
            <Alert severity="error" title="Unable to load feature flags">
              {error instanceof Error ? error.message : 'An unknown error occurred while loading Labs data.'}
            </Alert>
          )}

          {loading && <LabsTableSkeleton />}

          {value && <LabsTable toggles={filteredToggles} />}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function LabsTable({ toggles }: { toggles: FeatureToggle[] }) {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table className="filter-table">
        <thead>
          <tr>
            <th align="left">Feature flag</th>
            <th align="left">Stage</th>
            <th align="left">Enabled</th>
            <th align="left">Description</th>
          </tr>
        </thead>
        <tbody>
          {toggles.map((toggle) => (
            <tr key={toggle.name}>
              <td>
                <Text element="span" weight="medium">
                  {toggle.name}
                </Text>
              </td>
              <td>
                <Badge text={formatStage(toggle.stage)} color="blue" />
              </td>
              <td>
                <Badge
                  text={toggle.enabled ? 'Enabled' : 'Disabled'}
                  color={toggle.enabled ? 'green' : 'darkgrey'}
                />
              </td>
              <td>{toggle.description}</td>
            </tr>
          ))}
          {toggles.length === 0 && (
            <tr>
              <td colSpan={4}>
                <Text color="secondary">No feature flags match the current filter.</Text>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LabsTableSkeleton() {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table className="filter-table">
        <thead>
          <tr>
            <th align="left">Feature flag</th>
            <th align="left">Stage</th>
            <th align="left">Enabled</th>
            <th align="left">Description</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, index) => (
            <tr key={index}>
              <td>Loading...</td>
              <td>Loading...</td>
              <td>Loading...</td>
              <td>Loading...</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatStage(stage: string) {
  switch (stage) {
    case 'privatePreview':
      return 'Private preview';
    case 'preview':
      return 'Preview';
    case 'GA':
      return 'GA';
    default:
      return stage.charAt(0).toUpperCase() + stage.slice(1);
  }
}
