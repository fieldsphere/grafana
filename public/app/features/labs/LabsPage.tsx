import { useCallback, useEffect, useMemo, useState } from 'react';

import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getBackendSrv } from '@grafana/runtime';
import {
  Alert,
  Button,
  Field,
  Input,
  InteractiveTable,
  LoadingPlaceholder,
  Stack,
  Switch,
  Text,
  useStyles2,
  type CellProps,
  type Column,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/services/context_srv';

export interface LabsToggleSource {
  kind?: string;
  name?: string;
}

export interface LabsToggleStatus {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  writeable: boolean;
  warning?: string;
  source?: LabsToggleSource;
}

export interface LabsResolvedState {
  allowEditing: boolean;
  restartRequired: boolean;
  enabled: Record<string, boolean>;
  toggles: LabsToggleStatus[];
}

const apiPath = '/api/admin/feature-toggles/labs';

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const isGrafanaAdmin = contextSrv.isGrafanaAdmin;
  const [state, setState] = useState<LabsResolvedState | null>(null);
  const [loading, setLoading] = useState(isGrafanaAdmin);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBackendSrv().get<LabsResolvedState>(apiPath);
      setState(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isGrafanaAdmin) {
      setLoading(false);
      return;
    }
    void load();
  }, [isGrafanaAdmin, load]);

  const filteredRows = useMemo(() => {
    if (!state?.toggles) {
      return [];
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      return state.toggles;
    }
    return state.toggles.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        t.stage.toLowerCase().includes(q)
    );
  }, [state, query]);

  const setToggle = useCallback(async (name: string, enabled: boolean) => {
    setPending((p) => ({ ...p, [name]: true }));
    try {
      const data = await getBackendSrv().put<LabsResolvedState>(`${apiPath}/${encodeURIComponent(name)}`, {
        enabled,
      });
      setState(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending((p) => {
        const next = { ...p };
        delete next[name];
        return next;
      });
    }
  }, []);

  const clearOverride = useCallback(async (name: string) => {
    setPending((p) => ({ ...p, [name]: true }));
    try {
      const data = await getBackendSrv().delete<LabsResolvedState>(`${apiPath}/${encodeURIComponent(name)}`);
      setState(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending((p) => {
        const next = { ...p };
        delete next[name];
        return next;
      });
    }
  }, []);

  const columns = useMemo((): Array<Column<LabsToggleStatus>> => {
    return [
      {
        id: 'name',
        header: t('labs-page.column.name', 'Flag'),
        cell: ({ row: { original: row } }: CellProps<LabsToggleStatus, string>) => (
          <Stack direction="column" gap={0.5}>
            <Text element="span">{row.name}</Text>
            {row.warning ? (
              <Text element="span" variant="bodySmall" color="warning">
                {row.warning}
              </Text>
            ) : null}
          </Stack>
        ),
      },
      {
        id: 'stage',
        header: t('labs-page.column.stage', 'Stage'),
        cell: ({ row: { original: row } }: CellProps<LabsToggleStatus, string>) => row.stage,
      },
      {
        id: 'description',
        header: t('labs-page.column.description', 'Description'),
        cell: ({ row: { original: row } }: CellProps<LabsToggleStatus, string>) => (
          <Text truncate title={row.description}>
            {row.description ?? '—'}
          </Text>
        ),
      },
      {
        id: 'source',
        header: t('labs-page.column.source', 'Source'),
        cell: ({ row: { original: row } }: CellProps<LabsToggleStatus, string>) =>
          row.source?.kind === 'LabsOverride'
            ? t('labs-page.source.override', 'Labs override')
            : t('labs-page.source.inherited', 'Inherited'),
      },
      {
        id: 'enabled',
        header: t('labs-page.column.enabled', 'Enabled'),
        cell: ({ row: { original: row } }: CellProps<LabsToggleStatus, string>) =>
          row.enabled ? t('labs-page.yes', 'Yes') : t('labs-page.no', 'No'),
      },
      {
        id: 'actions',
        header: t('labs-page.column.actions', 'Actions'),
        cell: ({ row: { original: row } }: CellProps<LabsToggleStatus, string>) => {
          const busy = Boolean(pending[row.name]);
          return (
            <Stack gap={1}>
              <Switch
                disabled={!row.writeable || busy || !isGrafanaAdmin}
                value={row.enabled}
                onChange={(ev) => void setToggle(row.name, ev.currentTarget.checked)}
              />
              {row.source?.kind === 'LabsOverride' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy || !isGrafanaAdmin}
                  onClick={() => void clearOverride(row.name)}
                >
                  <Trans i18nKey="labs-page.reset">Reset</Trans>
                </Button>
              ) : null}
            </Stack>
          );
        },
      },
    ];
  }, [clearOverride, isGrafanaAdmin, pending, setToggle]);

  return (
    <Page navId="labs">
      <Page.Contents>
        {!isGrafanaAdmin ? (
          <Alert severity="warning" title={t('labs-page.access-denied.title', 'Access denied')}>
            <Trans i18nKey="labs-page.access-denied.body">
              Only Grafana server administrators can open Labs feature toggles.
            </Trans>
          </Alert>
        ) : (
        <Stack direction="column" gap={2}>
          {state?.restartRequired ? (
            <Alert severity="warning" title={t('labs-page.restart.title', 'Restart may be required')}>
              <Trans i18nKey="labs-page.restart.body">
                At least one flag has a Labs override that normally requires a full Grafana restart to apply safely.
                The UI still updates effective values where possible; plan a restart for routing and startup-only flags.
              </Trans>
            </Alert>
          ) : null}

          {error ? (
            <Alert severity="error" title={t('labs-page.error.title', 'Something went wrong')}>
              {error}
            </Alert>
          ) : null}

          <Text>
            <Trans i18nKey="labs-page.intro">
              Frontend-only feature toggles can be turned on or off for this instance. Overrides are stored in the
              Grafana database and apply on top of configuration defaults.
            </Trans>
          </Text>

          <Field label={t('labs-page.search', 'Search')}>
            <Input
              width={40}
              placeholder={t('labs-page.search-placeholder', 'Filter by name, stage, or description')}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
            />
          </Field>

          {loading ? (
            <LoadingPlaceholder text={t('labs-page.loading', 'Loading feature toggles…')} />
          ) : (
            <div className={styles.tableWrap}>
              <InteractiveTable
                columns={columns}
                data={filteredRows}
                getRowId={(row) => row.name}
                pageSize={20}
              />
            </div>
          )}
        </Stack>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  tableWrap: css({
    marginTop: theme.spacing(1),
  }),
});
