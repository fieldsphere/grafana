import { css } from '@emotion/css';
import { useEffect, useMemo, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getBackendSrv, isFetchError } from '@grafana/runtime';
import {
  Alert,
  Badge,
  InteractiveTable,
  LoadingPlaceholder,
  type CellProps,
  type Column,
  useStyles2,
} from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

export interface LabsFeatureFlagRow {
  name: string;
  description?: string;
  stage: string;
  enabled: boolean;
  requiresDevMode?: boolean;
  frontendOnly?: boolean;
  requiresRestart?: boolean;
}

interface LabsFlagsResponse {
  flags: LabsFeatureFlagRow[];
}

export default function LabsPage() {
  const styles = useStyles2(getStyles);
  const [flags, setFlags] = useState<LabsFeatureFlagRow[] | undefined>();
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    let cancelled = false;
    getBackendSrv()
      .get<LabsFlagsResponse>('/api/featuremgmt/labs-flags')
      .then((res) => {
        if (!cancelled) {
          setFlags(res.flags);
          setError(undefined);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo(
    (): Array<Column<LabsFeatureFlagRow>> => [
      {
        id: 'name',
        header: t('labs.flags.column-name', 'Flag'),
        cell: ({ row: { original: f } }: CellProps<LabsFeatureFlagRow, void>) => (
          <span className={styles.mono}>{f.name}</span>
        ),
      },
      {
        id: 'stage',
        header: t('labs.flags.column-stage', 'Stage'),
        cell: ({ row: { original: f } }: CellProps<LabsFeatureFlagRow, void>) => f.stage,
      },
      {
        id: 'status',
        header: t('labs.flags.column-status', 'Status'),
        cell: ({ row: { original: f } }: CellProps<LabsFeatureFlagRow, void>) =>
          f.enabled ? (
            <Badge color="green" text={t('labs.flags.enabled', 'Enabled')} />
          ) : (
            <Badge color="orange" text={t('labs.flags.disabled', 'Disabled')} />
          ),
      },
      {
        id: 'notes',
        header: t('labs.flags.column-notes', 'Notes'),
        cell: ({ row: { original: f } }: CellProps<LabsFeatureFlagRow, void>) => {
          const parts: string[] = [];
          if (f.description) {
            parts.push(f.description);
          }
          if (f.requiresDevMode) {
            parts.push(t('labs.flags.note-dev-mode', 'Requires dev mode'));
          }
          if (f.frontendOnly) {
            parts.push(t('labs.flags.note-frontend', 'Frontend only'));
          }
          if (f.requiresRestart) {
            parts.push(t('labs.flags.note-restart', 'Requires restart to change'));
          }
          return parts.length ? <span className={styles.notes}>{parts.join(' · ')}</span> : '—';
        },
      },
    ],
    [styles.mono, styles.notes]
  );

  return (
    <Page navId="labs">
      <Page.Contents>
        <p className={styles.intro}>
          <Trans i18nKey="labs.flags.intro">
            All feature flags registered in this Grafana build and whether each is currently enabled for this instance.
          </Trans>
        </p>
        {error != null ? (
          <Alert severity="error" title={t('labs.flags.load-error-title', 'Could not load feature flags')}>
            {(isFetchError(error) && error.data?.message) ||
              t('labs.flags.load-error-body', 'Try again or confirm you have permission to read feature flags.')}
          </Alert>
        ) : null}
        {!flags && error == null && (
          <div className={styles.loader}>
            <LoadingPlaceholder text={t('labs.flags.loading', 'Loading feature flags…')} />
          </div>
        )}
        {flags && <InteractiveTable columns={columns} data={flags} getRowId={(f) => f.name} />}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  intro: css({
    marginBottom: theme.spacing(2),
    color: theme.colors.text.secondary,
    maxWidth: '720px',
  }),
  loader: css({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(4),
  }),
  mono: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.size.sm,
  }),
  notes: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});
