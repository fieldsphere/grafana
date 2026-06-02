import { css } from '@emotion/css';
import { useCallback, useMemo, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Alert, Badge, FilterInput, InlineSwitch, Stack, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

const LOCALSTORAGE_KEY = 'grafana.featureToggles';

interface ToggleEntry {
  name: string;
  enabled: boolean;
  overridden: boolean;
}

function getLocalStorageOverrides(): Record<string, boolean> {
  const raw = window.localStorage.getItem(LOCALSTORAGE_KEY);
  if (!raw) {
    return {};
  }
  const result: Record<string, boolean> = {};
  for (const pair of raw.split(',')) {
    const [key, val] = pair.split('=');
    if (key) {
      result[key] = val === 'true' || val === '1';
    }
  }
  return result;
}

function setLocalStorageOverrides(overrides: Record<string, boolean>) {
  const entries = Object.entries(overrides)
    .map(([k, v]) => `${k}=${v ? '1' : '0'}`)
    .join(',');
  if (entries) {
    window.localStorage.setItem(LOCALSTORAGE_KEY, entries);
  } else {
    window.localStorage.removeItem(LOCALSTORAGE_KEY);
  }
}

function FeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const [search, setSearch] = useState('');
  const [overrides, setOverrides] = useState<Record<string, boolean>>(getLocalStorageOverrides);
  const [dirty, setDirty] = useState(false);

  const toggles = useMemo<ToggleEntry[]>(() => {
    const featureToggles = config.featureToggles as Record<string, boolean>;
    const allKeys = new Set<string>([...Object.keys(featureToggles), ...Object.keys(overrides)]);

    return Array.from(allKeys)
      .sort()
      .map((name) => ({
        name,
        enabled: overrides[name] !== undefined ? overrides[name] : !!featureToggles[name],
        overridden: overrides[name] !== undefined,
      }));
  }, [overrides]);

  const filtered = useMemo(() => {
    if (!search) {
      return toggles;
    }
    const lower = search.toLowerCase();
    return toggles.filter((t) => t.name.toLowerCase().includes(lower));
  }, [toggles, search]);

  const handleToggle = useCallback(
    (name: string, checked: boolean) => {
      setOverrides((prev) => {
        const next = { ...prev };
        const serverValue = !!(config.featureToggles as Record<string, boolean>)[name];
        if (checked === serverValue) {
          delete next[name];
        } else {
          next[name] = checked;
        }
        setLocalStorageOverrides(next);
        return next;
      });
      setDirty(true);
    },
    []
  );

  const handleClearOverrides = useCallback(() => {
    setLocalStorageOverrides({});
    setOverrides({});
    setDirty(true);
  }, []);

  return (
    <Page navId="lab-feature-toggles">
      <Page.Contents>
        <Stack direction="column" gap={2}>
          {dirty && (
            <Alert severity="info" title="Reload required">
              Feature toggle changes are applied via localStorage and take effect after a page reload.
            </Alert>
          )}
          <Alert severity="warning" title="Development only">
            Feature toggles modified here are stored in your browser&apos;s localStorage and override server-side
            configuration. Changes only affect your browser session.
          </Alert>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <FilterInput placeholder="Search feature toggles..." value={search} onChange={setSearch} width={40} />
            {Object.keys(overrides).length > 0 && (
              <button className={styles.clearButton} onClick={handleClearOverrides}>
                Clear all overrides ({Object.keys(overrides).length})
              </button>
            )}
          </Stack>

          <Text color="secondary">
            Showing {filtered.length} of {toggles.length} feature toggles
          </Text>

          <table className="filter-table">
            <thead>
              <tr>
                <th>Feature Toggle</th>
                <th>Status</th>
                <th style={{ width: '100px' }}>Enabled</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((toggle) => (
                <tr key={toggle.name}>
                  <td>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Text>{toggle.name}</Text>
                      {toggle.overridden && <Badge text="Override" color="orange" icon="exclamation-triangle" />}
                    </Stack>
                  </td>
                  <td>
                    <Badge
                      text={toggle.enabled ? 'Enabled' : 'Disabled'}
                      color={toggle.enabled ? 'green' : 'red'}
                    />
                  </td>
                  <td>
                    <InlineSwitch
                      value={toggle.enabled}
                      onChange={(e) => handleToggle(toggle.name, e.currentTarget.checked)}
                      showLabel={false}
                      transparent
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <Text color="secondary" italic>
              No feature toggles match your search.
            </Text>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    clearButton: css({
      background: 'none',
      border: `1px solid ${theme.colors.warning.border}`,
      borderRadius: theme.shape.radius.default,
      color: theme.colors.warning.text,
      cursor: 'pointer',
      padding: theme.spacing(0.5, 1),
      fontSize: theme.typography.bodySmall.fontSize,
      '&:hover': {
        backgroundColor: theme.colors.warning.transparent,
      },
    }),
  };
}

export default FeatureTogglesPage;
