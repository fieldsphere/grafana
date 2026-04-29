import { ChangeEvent, useMemo, useState } from 'react';

import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Badge, Field, Input, Switch, Text, useStyles2 } from '@grafana/ui';
import config from 'app/core/config';
import { Page } from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';

type FeatureFlag = {
  name: string;
  enabled: boolean;
};

export function FeatureFlagsPage() {
  const navModel = useNavModel('labs');
  const styles = useStyles2(getStyles);
  const [filter, setFilter] = useState('');
  const [showDisabled, setShowDisabled] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const flags = useMemo(() => {
    return Object.entries(config.featureToggles)
      .map(([name, enabled]) => ({
        name,
        enabled: overrides[name] ?? Boolean(enabled),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [overrides]);

  const filteredFlags = useMemo(() => {
    const lowerFilter = filter.trim().toLowerCase();
    if (!lowerFilter) {
      return flags;
    }

    return flags.filter((flag) => flag.name.toLowerCase().includes(lowerFilter));
  }, [filter, flags]);

  const visibleFlags = filteredFlags.filter((flag) => showDisabled || flag.enabled);

  const enabledCount = flags.filter((flag) => flag.enabled).length;

  const onToggle = (flag: FeatureFlag) => (event: ChangeEvent<HTMLInputElement>) => {
    const enabled = event.currentTarget.checked;
    config.featureToggles[flag.name] = enabled;
    setOverrides((current) => ({ ...current, [flag.name]: enabled }));
  };

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <div className={styles.header}>
          <div>
            <Text element="h1">
              <Trans i18nKey="labs.feature-flags.title">Feature flags</Trans>
            </Text>
            <Text color="secondary">
              <Trans i18nKey="labs.feature-flags.description">
                View enabled feature flags and control their runtime state in this session.
              </Trans>
            </Text>
          </div>
          <Badge
            color="blue"
            text={t('labs.feature-flags.enabled-count', '{{enabledCount}} enabled', { enabledCount })}
          />
        </div>

        <div className={styles.toolbar}>
          <Field label={t('labs.feature-flags.search-label', 'Search feature flags')}>
            <Input
              width={40}
              value={filter}
              onChange={(event) => setFilter(event.currentTarget.value)}
              placeholder={t('labs.feature-flags.search-placeholder', 'Search by flag name')}
            />
          </Field>
          <Switch
            label={t('labs.feature-flags.show-disabled-label', 'Show disabled feature flags')}
            value={showDisabled}
            onChange={(event) => setShowDisabled(event.currentTarget.checked)}
          />
        </div>

        <div className={styles.flagList}>
          {visibleFlags.map((flag) => (
            <div className={styles.flagRow} key={flag.name}>
              <div>
                <Text element="div" weight="medium">
                  {flag.name}
                </Text>
                <Text color="secondary">
                  {flag.enabled
                    ? t('labs.feature-flags.status-enabled', 'Enabled')
                    : t('labs.feature-flags.status-disabled', 'Disabled')}
                </Text>
              </div>
              <Switch label={getToggleLabel(flag)} value={flag.enabled} onChange={onToggle(flag)} />
            </div>
          ))}
        </div>
      </Page.Contents>
    </Page>
  );
}

export default FeatureFlagsPage;

function getToggleLabel(flag: FeatureFlag) {
  if (flag.enabled) {
    return t('labs.feature-flags.disable-flag', 'Disable {{flagName}}', { flagName: flag.name });
  }

  return t('labs.feature-flags.enable-flag', 'Enable {{flagName}}', { flagName: flag.name });
}

function getStyles(theme: GrafanaTheme2) {
  return {
    header: css({
      alignItems: 'flex-start',
      display: 'flex',
      gap: theme.spacing(2),
      justifyContent: 'space-between',
      marginBottom: theme.spacing(3),
    }),
    toolbar: css({
      alignItems: 'flex-end',
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(2),
      marginBottom: theme.spacing(2),
    }),
    flagList: css({
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      overflow: 'hidden',
    }),
    flagRow: css({
      alignItems: 'center',
      background: theme.colors.background.primary,
      display: 'flex',
      justifyContent: 'space-between',
      gap: theme.spacing(2),
      padding: theme.spacing(2),

      '& + &': {
        borderTop: `1px solid ${theme.colors.border.weak}`,
      },
    }),
  };
}
