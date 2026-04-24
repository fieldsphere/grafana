import { useCallback, useEffect, useMemo, useState } from 'react';

import { css } from '@emotion/css';
import { useDebounce } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { isFetchError, locationService } from '@grafana/runtime';
import { Field, Input, Stack, Switch, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/services/context_srv';

import { clearLabsFeatureToggleOverride, getLabsFeatureToggles, setLabsFeatureToggle } from './api';
import { LabsFeatureFlag } from './types';

export function LabsPage() {
  const styles = useStyles2(getStyles);
  const [flags, setFlags] = useState<LabsFeatureFlag[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [qDeb, setQDeb] = useState('');
  const [onlyEnabled, setOnlyEnabled] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const canControl = contextSrv.hasRole('Admin') || contextSrv.isGrafanaAdmin;

  const refresh = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    getLabsFeatureToggles()
      .then((data) => setFlags(data))
      .catch((err) => {
        const msg = isFetchError(err) ? (err as Error).message : t('labs.load-error', 'Failed to load feature flags');
        setLoadError(msg);
        setFlags([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useDebounce(
    () => {
      setQDeb(q);
    },
    200,
    [q]
  );

  const filtered = useMemo(() => {
    const s = qDeb.trim().toLowerCase();
    return flags.filter((f) => {
      if (onlyEnabled && !f.enabled) {
        return false;
      }
      if (s.length === 0) {
        return true;
      }
      return (
        f.name.toLowerCase().includes(s) ||
        f.description.toLowerCase().includes(s) ||
        f.stage.toLowerCase().includes(s)
      );
    });
  }, [flags, onlyEnabled, qDeb]);

  const onToggle = async (flag: LabsFeatureFlag, on: boolean) => {
    if (!canControl) {
      return;
    }
    setBusy((b) => ({ ...b, [flag.name]: true }));
    const prev = flags;
    try {
      setFlags((cur) =>
        cur.map((f) => (f.name === flag.name ? { ...f, enabled: on, hasRuntimeOverride: true, runtimeOverrideValue: on } : f))
      );
      await setLabsFeatureToggle(flag.name, on);
      await refresh();
    } catch (e) {
      if (isFetchError(e) && (e as { status?: number }).status === 403) {
        locationService.push('/');
        return;
      }
      setFlags(prev);
    } finally {
      setBusy((b) => ({ ...b, [flag.name]: false }));
    }
  };

  const onClear = async (flag: LabsFeatureFlag) => {
    if (!canControl) {
      return;
    }
    setBusy((b) => ({ ...b, [flag.name]: true }));
    try {
      await clearLabsFeatureToggleOverride(flag.name);
      await refresh();
    } finally {
      setBusy((b) => ({ ...b, [flag.name]: false }));
    }
  };

  if (!contextSrv.isSignedIn) {
    return null;
  }

  return (
    <Page
      navId="labs"
      subTitle={t('labs.subtitle', 'View enabled feature flags and apply server-side runtime overrides.')}
    >
      <Page.Contents>
        <p className={styles.blurb}>
          <Trans i18nKey="labs.instructions">
            Toggle changes save a server-side override. “Clear override” returns to the value from configuration or defaults.
            Some flags need a process restart; check the labels below.
          </Trans>
        </p>
        {!canControl && (
          <p className={styles.warn}>
            <Trans i18nKey="labs.readonly">You need org Admin or server admin to change flags. List is read-only.</Trans>
          </p>
        )}
        {loadError && <p className={styles.error}>{loadError}</p>}

        <div className={styles.toolbar}>
          <Field label={t('labs.search', 'Filter')}>
            <Input
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              placeholder={t('labs.search-placeholder', 'Name, description, or stage')}
              width={50}
            />
          </Field>
          <Field label={t('labs.show-enabled', 'Show enabled only')}>
            <Switch value={onlyEnabled} onChange={() => setOnlyEnabled((v) => !v)} />
          </Field>
        </div>

        {loading ? (
          <p>{t('common.loading', 'Loading...')}</p>
        ) : (
          <div className={styles.list}>
            {filtered.map((f) => (
              <div className={styles.card} key={f.name}>
                <div className={styles.cardHead}>
                  <code className={styles.code}>{f.name}</code>
                  <div className={styles.badges}>
                    <span className={styles.pill}>{f.stage}</span>
                    {f.requiresDevMode && <span className={styles.pillWarn}>{t('labs.dev-only', 'Dev only')}</span>}
                    {f.requiresRestart && (
                      <span className={styles.pillWarn}>{t('labs.requires-restart', 'May need restart')}</span>
                    )}
                    {f.frontendOnly && <span className={styles.pill}>{t('labs.frontend', 'Frontend')}</span>}
                  </div>
                </div>
                {f.description && (
                  <Text variant="bodySmall" className={styles.desc}>
                    {f.description}
                  </Text>
                )}
                <Stack direction="row" alignItems="center" gap={2} wrap>
                  {canControl && (
                    <>
                      <Switch value={f.enabled} onChange={() => onToggle(f, !f.enabled)} disabled={Boolean(busy[f.name])} />
                      {f.hasRuntimeOverride && (
                        <button
                          type="button"
                          className={styles.clearBtn}
                          onClick={() => onClear(f)}
                          disabled={Boolean(busy[f.name])}
                        >
                          {t('labs.clear-override', 'Clear override')}
                        </button>
                      )}
                    </>
                  )}
                </Stack>
                {f.hasRuntimeOverride && (
                  <p className={styles.muted}>
                    {t('labs.runtime-override', 'Override value')}: {String(f.runtimeOverrideValue)}
                  </p>
                )}
                {f.expression && (
                  <p className={styles.muted}>
                    {t('labs.expression', 'Default expression')}: {f.expression}
                  </p>
                )}
              </div>
            ))}
            {filtered.length === 0 && <p className={styles.muted}>{t('labs.empty', 'No feature flags match your filter.')}</p>}
          </div>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  blurb: css({ margin: `0 0 ${theme.spacing(2)}` }),
  toolbar: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    alignItems: 'flex-end',
  }),
  list: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(2) }),
  card: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.borderRadius(1),
    padding: theme.spacing(2),
    background: theme.colors.background.primary,
  }),
  cardHead: css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1),
    justifyContent: 'space-between',
  }),
  code: css({ fontWeight: 600, color: theme.colors.text.primary }),
  badges: css({ display: 'flex', flexWrap: 'wrap', gap: 6 }),
  pill: css({
    fontSize: 11,
    textTransform: 'uppercase' as const,
    padding: '2px 8px',
    borderRadius: 4,
    background: theme.colors.action.hover,
  }),
  pillWarn: css({ fontSize: 12, color: theme.colors.warning.text }),
  desc: css({ color: theme.colors.text.secondary, maxWidth: '80ch', margin: `${theme.spacing(1)} 0` }),
  error: css({ color: theme.colors.error.text, marginBottom: 8 }),
  warn: css({ color: theme.colors.warning.text, marginBottom: 8 }),
  clearBtn: css({
    background: 'none',
    border: 'none',
    color: theme.colors.primary.text,
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
    font: 'inherit',
  }),
  muted: css({ color: theme.colors.text.secondary, fontSize: 12, margin: 0 }),
});

export default LabsPage;
