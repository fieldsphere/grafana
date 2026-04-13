import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { type FeatureToggles as FeatureTogglesType, type GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Alert, Badge, Button, Card, Input, Stack, Switch, Tooltip, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

const LOCAL_STORAGE_KEY = 'grafana.featureToggles';

type ToggleEntry = {
  name: string;
  enabled: boolean;
  overridden: boolean;
};

function parseOverridesFromLocalStorage(): Record<string, boolean> {
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, boolean>>((acc, entry) => {
      const [name, value] = entry.split('=');
      if (!name) {
        return acc;
      }
      acc[name] = value === 'true' || value === '1';
      return acc;
    }, {});
}

function serializeOverrides(overrides: Record<string, boolean>): string {
  return Object.entries(overrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value ? '1' : '0'}`)
    .join(',');
}

function getInitialToggles(): ToggleEntry[] {
  const runtimeToggles = config.featureToggles as FeatureTogglesType & Record<string, boolean | undefined>;
  const localOverrides = parseOverridesFromLocalStorage();
  const toggleNames = Object.keys(runtimeToggles).filter((name) => typeof runtimeToggles[name] === 'boolean');

  return toggleNames
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      enabled: Boolean(runtimeToggles[name]),
      overridden: Object.prototype.hasOwnProperty.call(localOverrides, name),
    }));
}

function getSessionOverrideTooltip() {
  return (
    <>
      Labs overrides are persisted in browser local storage and applied on page load. They only affect this browser
      session and do not update server-side feature flags.
    </>
  );
}

export function LabsPage() {
  const styles = useStyles2(getStyles);
  const canWrite = contextSrv.hasPermission(AccessControlAction.FeatureManagementWrite);
  const [query, setQuery] = useState('');
  const [toggles, setToggles] = useState<ToggleEntry[]>(() => getInitialToggles());
  const [hasSaved, setHasSaved] = useState(false);

  const visibleToggles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return toggles;
    }

    return toggles.filter((toggle) => toggle.name.toLowerCase().includes(normalizedQuery));
  }, [query, toggles]);

  const enabledCount = toggles.filter((toggle) => toggle.enabled).length;
  const overriddenCount = toggles.filter((toggle) => toggle.overridden).length;

  const saveOverrides = () => {
    const overrides = toggles
      .filter((toggle) => toggle.overridden)
      .reduce<Record<string, boolean>>((acc, toggle) => {
        acc[toggle.name] = toggle.enabled;
        return acc;
      }, {});

    const serialized = serializeOverrides(overrides);
    if (serialized) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setHasSaved(true);
  };

  const clearOverrides = () => {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    setToggles(getInitialToggles());
    setHasSaved(false);
  };

  return (
    <Page navId="labs-feature-toggles">
      <Page.Contents>
        <Stack gap={2}>
          <h1 className={styles.title}>Labs: feature toggles</h1>
          <p className={styles.subtitle}>
            Enabled flags shown below come from the current runtime config. You can override flags locally for this
            browser session and reload to test behavior.
          </p>
          <div className={styles.labelRow}>
            <span className={styles.labelText}>Session override</span>
            <Tooltip content={getSessionOverrideTooltip()}>
              <span>
                <Badge color="orange" text="Labs" />
              </span>
            </Tooltip>
          </div>

          {!canWrite && (
            <Alert
              severity="warning"
              title="Read-only access"
              className={styles.alert}
            >
              You can view feature toggles, but your current role does not include feature management write permission.
            </Alert>
          )}
          {hasSaved && (
            <Alert severity="success" title="Local overrides saved" className={styles.alert}>
              Refresh the page to apply saved local overrides.
            </Alert>
          )}

          <div className={styles.controls}>
            <Input
              className={styles.search}
              value={query}
              placeholder="Filter feature toggles"
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <Button disabled={!canWrite} onClick={saveOverrides}>
              Save browser overrides
            </Button>
            <Button variant="secondary" disabled={!canWrite} onClick={clearOverrides}>
              Clear overrides
            </Button>
          </div>

          <p className={styles.summary}>
            {enabledCount} enabled / {toggles.length} total, {overriddenCount} local override
            {overriddenCount === 1 ? '' : 's'}.
          </p>

          <div className={styles.grid}>
            {visibleToggles.map((toggle) => (
              <Card key={toggle.name}>
                <Card.Heading>{toggle.name}</Card.Heading>
                <Card.Description>
                  Runtime value: <strong>{toggle.enabled ? 'enabled' : 'disabled'}</strong>
                  {toggle.overridden && <Badge color="orange" className={styles.overrideTag} text="Local override" />}
                </Card.Description>
                <Switch
                  value={toggle.enabled}
                  disabled={!canWrite}
                  label={toggle.enabled ? 'Enabled' : 'Disabled'}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setHasSaved(false);
                    setToggles((current) =>
                      current.map((entry) =>
                        entry.name === toggle.name ? { ...entry, enabled: checked, overridden: true } : entry
                      )
                    );
                  }}
                />
              </Card>
            ))}
          </div>
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  title: css({
    margin: 0,
  }),
  subtitle: css({
    color: theme.colors.text.secondary,
    margin: 0,
  }),
  alert: css({
    marginBottom: theme.spacing(1),
  }),
  controls: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  }),
  search: css({
    minWidth: 320,
  }),
  summary: css({
    margin: 0,
    color: theme.colors.text.secondary,
  }),
  grid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: theme.spacing(1.5),
  }),
  labelRow: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  labelText: css({
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  overrideTag: css({
    marginLeft: theme.spacing(1),
    fontSize: theme.typography.bodySmall.fontSize,
    display: 'inline-flex',
    verticalAlign: 'middle',
  }),
});
