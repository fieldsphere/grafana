import { css } from '@emotion/css';
import { useCallback, useState } from 'react';
import { useAsync } from 'react-use';

import type { GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Alert, Badge, FilterInput, InteractiveTable, Switch, type CellProps, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  stage: string;
}

function getStageBadgeColor(stage: string): 'blue' | 'orange' | 'green' | 'red' | 'purple' {
  switch (stage) {
    case 'experimental':
      return 'orange';
    case 'privatePreview':
      return 'purple';
    case 'preview':
      return 'blue';
    case 'GA':
      return 'green';
    case 'deprecated':
      return 'red';
    default:
      return 'blue';
  }
}

export default function FeatureLabPage() {
  const styles = useStyles2(getStyles);
  const [search, setSearch] = useState('');
  const [flags, setFlags] = useState<FeatureFlag[]>([]);

  const { loading, error } = useAsync(async () => {
    const result = await getBackendSrv().get<FeatureFlag[]>('/api/featuremgmt/features');
    result.sort((a, b) => a.name.localeCompare(b.name));
    setFlags(result);
    return result;
  }, []);

  const handleToggle = useCallback(
    async (name: string, enabled: boolean) => {
      await getBackendSrv().put(`/api/featuremgmt/features/${name}`, { enabled });
      setFlags((prev) => prev.map((f) => (f.name === name ? { ...f, enabled } : f)));
    },
    []
  );

  const filteredFlags = flags.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      id: 'name',
      header: 'Flag',
      cell: ({ row }: CellProps<FeatureFlag, void>) => (
        <span className={styles.flagName}>{row.original.name}</span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: ({ row }: CellProps<FeatureFlag, void>) => (
        <span className={styles.description}>{row.original.description}</span>
      ),
    },
    {
      id: 'stage',
      header: 'Stage',
      cell: ({ row }: CellProps<FeatureFlag, void>) => (
        <Badge text={row.original.stage} color={getStageBadgeColor(row.original.stage)} />
      ),
    },
    {
      id: 'enabled',
      header: 'Enabled',
      cell: ({ row }: CellProps<FeatureFlag, void>) => (
        <Switch
          value={row.original.enabled}
          onChange={(e) => {
            const checked = e.currentTarget.checked;
            handleToggle(row.original.name, checked);
          }}
        />
      ),
    },
  ];

  return (
    <Page navId="feature-lab">
      <Page.Contents>
        <Alert severity="info" title="Runtime only">
          Changes made here are in-memory only and will reset when Grafana restarts. To persist changes, update your
          configuration file.
        </Alert>
        <div className={styles.searchWrapper}>
          <FilterInput placeholder="Search feature flags..." value={search} onChange={setSearch} />
        </div>
        {error && <Alert severity="error" title="Failed to load feature flags" />}
        {!loading && (
          <InteractiveTable columns={columns} data={filteredFlags} getRowId={(f) => f.name} />
        )}
      </Page.Contents>
    </Page>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    searchWrapper: css({
      marginBottom: theme.spacing(2),
      maxWidth: '400px',
    }),
    flagName: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    description: css({
      color: theme.colors.text.secondary,
    }),
  };
}
