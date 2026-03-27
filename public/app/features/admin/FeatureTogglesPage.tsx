import { css } from '@emotion/css';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppEvents, GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getAppEvents, getBackendSrv } from '@grafana/runtime';
import { Alert, Input, Spinner, Stack, Switch, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

type FeatureToggleDTO = {
  name: string;
  description: string;
  stage: string;
  requiresDevMode: boolean;
  requiresRestart: boolean;
  enabled: boolean;
};

type UpdateFeatureToggleResponse = {
  name: string;
  enabled: boolean;
};

const appEvents = getAppEvents();

export default function FeatureTogglesPage() {
  const styles = useStyles2(getStyles);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [query, setQuery] = useState('');
  const [featureToggles, setFeatureToggles] = useState<FeatureToggleDTO[]>([]);
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});

  const canWrite = contextSrv.hasPermission(AccessControlAction.FeatureManagementWrite);

  const loadToggles = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const values = await getBackendSrv().get<FeatureToggleDTO[]>('/api/feature-toggles');
      setFeatureToggles(values);
    } catch (error) {
      setIsError(true);
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [t('admin.feature-toggles.load-error', 'Failed to load feature toggles'), error as Error],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToggles();
  }, [loadToggles]);

  const onToggle = useCallback(
    async (name: string, enabled: boolean) => {
      setPendingToggles((current) => ({ ...current, [name]: true }));
      setFeatureToggles((current) => current.map((item) => (item.name === name ? { ...item, enabled } : item)));

      try {
        const result = await getBackendSrv().put<UpdateFeatureToggleResponse>(
          `/api/feature-toggles/${encodeURIComponent(name)}`,
          { enabled }
        );
        setFeatureToggles((current) =>
          current.map((item) => (item.name === name ? { ...item, enabled: result.enabled } : item))
        );
        appEvents.publish({
          type: AppEvents.alertSuccess.name,
          payload: [
            result.enabled
              ? t('admin.feature-toggles.enabled', 'Enabled {{name}}', { name })
              : t('admin.feature-toggles.disabled', 'Disabled {{name}}', { name }),
          ],
        });
      } catch (error) {
        // Revert optimistic update on failure.
        setFeatureToggles((current) =>
          current.map((item) => (item.name === name ? { ...item, enabled: !enabled } : item))
        );
        appEvents.publish({
          type: AppEvents.alertError.name,
          payload: [t('admin.feature-toggles.update-error', 'Failed to update feature toggle'), error as Error],
        });
      } finally {
        setPendingToggles((current) => {
          const next = { ...current };
          delete next[name];
          return next;
        });
      }
    },
    [setFeatureToggles]
  );

  const visibleToggles = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return featureToggles;
    }

    return featureToggles.filter((item) => {
      return (
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.stage.toLowerCase().includes(search)
      );
    });
  }, [featureToggles, query]);

  return (
    <Page navId="feature-toggles">
      <Page.Contents isLoading={isLoading}>
        <Stack direction="column" gap={2}>
          <Alert title={t('admin.feature-toggles.runtime-note-title', 'Runtime-only changes')}>
            {t(
              'admin.feature-toggles.runtime-note-body',
              'Changes here affect in-memory state and are not persisted across Grafana restarts.'
            )}
          </Alert>
          {!canWrite && (
            <Alert title={t('admin.feature-toggles.read-only-title', 'Read only')} severity="info">
              {t('admin.feature-toggles.read-only-body', 'You have permission to view toggles but not to change them.')}
            </Alert>
          )}

          <Input
            aria-label={t('admin.feature-toggles.search-label', 'Search feature toggles')}
            placeholder={t('admin.feature-toggles.search-placeholder', 'Search by name, stage, or description')}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />

          {!isLoading && !isError && visibleToggles.length === 0 && (
            <Text color="secondary">{t('admin.feature-toggles.empty', 'No feature toggles match your search.')}</Text>
          )}

          {!isLoading && isError && (
            <Text color="warning">
              {t('admin.feature-toggles.load-error-inline', 'Unable to load feature toggles.')}
            </Text>
          )}

          <div className={styles.list} data-testid="feature-toggles-list">
            {visibleToggles.map((item) => {
              const isPending = Boolean(pendingToggles[item.name]);
              return (
                <div className={styles.row} key={item.name}>
                  <div className={styles.meta}>
                    <Text element="h5">{item.name}</Text>
                    {item.description && (
                      <Text color="secondary" variant="bodySmall">
                        {item.description}
                      </Text>
                    )}
                    <Text color="secondary" variant="bodySmall">
                      {t('admin.feature-toggles.stage', 'Stage: {{stage}}', { stage: item.stage })}
                      {item.requiresDevMode
                        ? ` · ${t('admin.feature-toggles.requires-dev-mode', 'Requires dev mode')}`
                        : ''}
                      {item.requiresRestart
                        ? ` · ${t('admin.feature-toggles.requires-restart', 'Requires restart')}`
                        : ''}
                    </Text>
                  </div>
                  <div className={styles.toggleWrap}>
                    {isPending && <Spinner inline size={14} />}
                    <Switch
                      value={item.enabled}
                      disabled={!canWrite || isPending}
                      onChange={(event) => onToggle(item.name, event.currentTarget.checked)}
                      aria-label={t('admin.feature-toggles.switch-label', 'Toggle {{name}}', { name: item.name })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Stack>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    list: css({
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      overflow: 'hidden',
    }),
    row: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(2),
      padding: theme.spacing(2),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      '&:last-child': {
        borderBottom: 'none',
      },
    }),
    meta: css({
      minWidth: 0,
      flexGrow: 1,
    }),
    toggleWrap: css({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
    }),
  };
};
