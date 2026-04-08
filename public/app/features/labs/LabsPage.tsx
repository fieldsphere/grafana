import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import {
  Badge,
  Card,
  FilterInput,
  Icon,
  Stack,
  Switch,
  Text,
  Tooltip,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

const LOCAL_STORAGE_KEY = 'grafana.featureToggles';

interface FeatureToggleEntry {
  name: string;
  enabled: boolean;
  localOverride: boolean | undefined;
}

function parseLocalOverrides(): Record<string, boolean> {
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    return {};
  }
  const overrides: Record<string, boolean> = {};
  for (const part of raw.split(',')) {
    const [key, val] = part.split('=');
    if (key) {
      overrides[key] = val === 'true' || val === '1';
    }
  }
  return overrides;
}

function saveLocalOverrides(overrides: Record<string, boolean>) {
  const parts = Object.entries(overrides).map(([k, v]) => `${k}=${v ? '1' : '0'}`);
  if (parts.length === 0) {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  } else {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, parts.join(','));
  }
}

function getFeatureToggles(overrides: Record<string, boolean>): FeatureToggleEntry[] {
  const serverToggles = config.featureToggles as Record<string, boolean | undefined>;
  const allKeys = new Set<string>();

  for (const key of Object.keys(serverToggles)) {
    allKeys.add(key);
  }
  for (const key of Object.keys(overrides)) {
    allKeys.add(key);
  }

  const sorted = Array.from(allKeys).sort();
  return sorted.map((name) => {
    const serverVal = serverToggles[name] ?? false;
    const localVal = overrides[name];
    return {
      name,
      enabled: localVal !== undefined ? localVal : !!serverVal,
      localOverride: localVal,
    };
  });
}

type FilterMode = 'all' | 'enabled' | 'disabled' | 'overridden';

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [overrides, setOverrides] = useState<Record<string, boolean>>(parseLocalOverrides);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const toggles = useMemo(() => getFeatureToggles(overrides), [overrides]);

  const filtered = useMemo(() => {
    let list = toggles;
    if (search) {
      const lower = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(lower));
    }
    if (filterMode === 'enabled') {
      list = list.filter((t) => t.enabled);
    } else if (filterMode === 'disabled') {
      list = list.filter((t) => !t.enabled);
    } else if (filterMode === 'overridden') {
      list = list.filter((t) => t.localOverride !== undefined);
    }
    return list;
  }, [toggles, search, filterMode]);

  const counts = useMemo(() => {
    const enabled = toggles.filter((t) => t.enabled).length;
    const overridden = toggles.filter((t) => t.localOverride !== undefined).length;
    return { total: toggles.length, enabled, disabled: toggles.length - enabled, overridden };
  }, [toggles]);

  function handleToggle(name: string, newVal: boolean) {
    const next = { ...overrides, [name]: newVal };
    setOverrides(next);
    saveLocalOverrides(next);
  }

  function handleReset(name: string) {
    const next = { ...overrides };
    delete next[name];
    setOverrides(next);
    saveLocalOverrides(next);
  }

  function handleResetAll() {
    setOverrides({});
    saveLocalOverrides({});
  }

  return (
    <Page navId="labs">
      <Page.Contents>
        <div className={styles.header}>
          <Stack direction="column" gap={1}>
            <Text element="h2" variant="h3">
              <Icon name="flask" className={styles.titleIcon} />
              Feature Toggles
            </Text>
            <Text color="secondary">
              View and override feature flags via local storage. Overrides apply to this browser only and
              require a page reload to take effect.
            </Text>
          </Stack>
        </div>

        <div className={styles.statsRow}>
          <Badge
            text={`${counts.total} total`}
            color="blue"
            icon="list-ul"
            className={styles.statBadge}
            onClick={() => setFilterMode('all')}
          />
          <Badge
            text={`${counts.enabled} enabled`}
            color="green"
            icon="check"
            className={styles.statBadge}
            onClick={() => setFilterMode('enabled')}
          />
          <Badge
            text={`${counts.disabled} disabled`}
            color="red"
            icon="times"
            className={styles.statBadge}
            onClick={() => setFilterMode('disabled')}
          />
          <Badge
            text={`${counts.overridden} overridden`}
            color="orange"
            icon="pen"
            className={styles.statBadge}
            onClick={() => setFilterMode('overridden')}
          />
          {counts.overridden > 0 && (
            <button className={styles.resetAllButton} onClick={handleResetAll}>
              <Icon name="history" size="sm" />
              Reset all overrides
            </button>
          )}
        </div>

        <div className={styles.searchBar}>
          <FilterInput
            placeholder="Search feature flags..."
            value={search}
            onChange={setSearch}
          />
        </div>

        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            <Icon name="search" size="xxl" />
            <Text color="secondary">No feature flags match your search.</Text>
          </div>
        )}

        <div className={styles.grid}>
          {filtered.map((toggle) => (
            <Card key={toggle.name} className={styles.card}>
              <Card.Heading>
                <Stack alignItems="center" gap={1}>
                  <Text truncate>{toggle.name}</Text>
                  {toggle.localOverride !== undefined && (
                    <Tooltip content="This flag has a local browser override. Click to reset.">
                      <Badge
                        text="override"
                        color="orange"
                        icon="pen"
                        className={styles.overrideBadge}
                        onClick={() => handleReset(toggle.name)}
                      />
                    </Tooltip>
                  )}
                </Stack>
              </Card.Heading>
              <Card.Actions>
                <Stack alignItems="center" gap={1}>
                  <Text color={toggle.enabled ? 'success' : 'secondary'} variant="bodySmall">
                    {toggle.enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                  <Switch
                    value={toggle.enabled}
                    onChange={() => handleToggle(toggle.name, !toggle.enabled)}
                  />
                </Stack>
              </Card.Actions>
            </Card>
          ))}
        </div>

        {counts.overridden > 0 && (
          <div className={styles.reloadHint}>
            <Icon name="info-circle" />
            <Text color="secondary">
              Reload the page for local overrides to take full effect.
            </Text>
          </div>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  header: css({
    marginBottom: theme.spacing(3),
  }),
  titleIcon: css({
    marginRight: theme.spacing(1),
    color: theme.colors.warning.text,
  }),
  statsRow: css({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: theme.spacing(2),
  }),
  statBadge: css({
    cursor: 'pointer',
  }),
  resetAllButton: css({
    background: 'none',
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    color: theme.colors.text.secondary,
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    '&:hover': {
      color: theme.colors.text.primary,
      borderColor: theme.colors.border.strong,
    },
  }),
  searchBar: css({
    marginBottom: theme.spacing(2),
    maxWidth: 480,
  }),
  grid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: theme.spacing(1),
  }),
  card: css({
    padding: theme.spacing(1.5),
  }),
  overrideBadge: css({
    cursor: 'pointer',
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  emptyState: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(6),
    gap: theme.spacing(2),
    color: theme.colors.text.disabled,
  }),
  reloadHint: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    background: theme.colors.info.transparent,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.info.border}`,
  }),
});
