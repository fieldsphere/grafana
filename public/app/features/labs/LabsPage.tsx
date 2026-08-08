import { css } from '@emotion/css';
import { ClientProviderEvents } from '@openfeature/web-sdk';
import { useEffect, useMemo, useState } from 'react';

import type { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { getLocalStorageProvider } from '@grafana/runtime/internal';
import { Badge, Button, Card, FeatureBadge, FilterInput, Icon, Stack, Switch, Text, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import {
  getFeatureStageState,
  labsFeatureFilters,
  labsFeatures,
  type LabsFeature,
  type LabsFeatureFilter,
} from './labsFlags';

type FlagOverrides = Record<string, unknown>;

type LabsFeatureWithState = LabsFeature & {
  enabled: boolean;
  override?: boolean;
  isOverridden: boolean;
};

const defaultFilter: LabsFeatureFilter = 'all';

function LabsPage() {
  const styles = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LabsFeatureFilter>(defaultFilter);
  const overrides = useLocalFlagOverrides();

  const features = useMemo(() => {
    return labsFeatures.map((feature): LabsFeatureWithState => {
      const override = getBooleanOverride(overrides, feature.key);

      return {
        ...feature,
        enabled: override ?? feature.defaultEnabled,
        override,
        isOverridden: override !== undefined,
      };
    });
  }, [overrides]);

  const filteredFeatures = useMemo(() => filterFeatures(features, query, filter), [features, filter, query]);
  const enabledCount = features.filter((feature) => feature.enabled).length;
  const overrideCount = features.filter((feature) => feature.isOverridden).length;

  return (
    <Page navId="profile/labs">
      <Page.Contents>
        <Stack direction="column" gap={3}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <Badge icon="flask" color="blue" text={t('labs.hero-badge', 'Labs')} />
              <Text element="h1">
                <Trans i18nKey="labs.title">Try new Grafana features</Trans>
              </Text>
              <Text variant="body" color="secondary">
                <Trans i18nKey="labs.description">
                  Opt into preview and experimental features for this browser. You can turn them off at any time.
                </Trans>
              </Text>
              <Stack direction="row" gap={1} alignItems="center">
                <Button icon="sync" variant="secondary" onClick={() => window.location.reload()}>
                  <Trans i18nKey="labs.reload-button">Reload to apply everywhere</Trans>
                </Button>
                <Button
                  icon="times"
                  variant="secondary"
                  fill="text"
                  disabled={overrideCount === 0}
                  onClick={resetAllLabsOverrides}
                >
                  <Trans i18nKey="labs.reset-all-button">Reset all Labs choices</Trans>
                </Button>
              </Stack>
            </div>
            <div className={styles.heroStats} aria-label={t('labs.summary-label', 'Labs summary')}>
              <Stat value={labsFeatures.length} label={t('labs.available-features-count', 'Available')} />
              <Stat value={enabledCount} label={t('labs.enabled-features-count', 'Enabled')} />
              <Stat value={overrideCount} label={t('labs.customized-features-count', 'Customized')} />
            </div>
          </section>

          <Card noMargin className={styles.controlsCard}>
            <Stack direction="column" gap={2}>
              <FilterInput
                value={query}
                onChange={setQuery}
                placeholder={t('labs.search-placeholder', 'Search Labs by feature, owner, or flag key')}
                aria-label={t('labs.search-label', 'Search Labs')}
              />
              <div className={styles.filters} aria-label={t('labs.filters-label', 'Labs filters')}>
                {labsFeatureFilters.map((filterOption) => (
                  <Button
                    key={filterOption}
                    size="sm"
                    variant={filterOption === filter ? 'primary' : 'secondary'}
                    fill={filterOption === filter ? 'solid' : 'outline'}
                    onClick={() => setFilter(filterOption)}
                  >
                    {getFilterLabel(filterOption)}
                  </Button>
                ))}
              </div>
            </Stack>
          </Card>

          {filteredFeatures.length > 0 ? (
            <div className={styles.featureGrid}>
              {filteredFeatures.map((feature) => (
                <LabsFeatureCard key={feature.key} feature={feature} />
              ))}
            </div>
          ) : (
            <Card noMargin className={styles.emptyState}>
              <Icon name="search" size="xxl" />
              <Text element="h2" variant="h3">
                <Trans i18nKey="labs.empty-title">No Labs match your search</Trans>
              </Text>
              <Text color="secondary">
                <Trans i18nKey="labs.empty-description">Try another keyword or filter.</Trans>
              </Text>
            </Card>
          )}
        </Stack>
      </Page.Contents>
    </Page>
  );
}

function LabsFeatureCard({ feature }: { feature: LabsFeatureWithState }) {
  const styles = useStyles2(getStyles);
  const switchId = `labs-feature-${feature.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  return (
    <Card noMargin className={feature.enabled ? styles.featureCardEnabled : styles.featureCard}>
      <Stack direction="column" gap={2}>
        <Stack direction="row" gap={2} justifyContent="space-between" alignItems="flex-start">
          <Stack direction="column" gap={1}>
            <Stack direction="row" gap={1} alignItems="center">
              <Text element="h2" variant="h4">
                {feature.title}
              </Text>
              <FeatureBadge featureState={getFeatureStageState(feature.stage)} />
            </Stack>
            <Text color="secondary">{feature.description}</Text>
          </Stack>
          <Switch
            id={switchId}
            value={feature.enabled}
            aria-label={t('labs.toggle-feature-label', 'Toggle {{featureTitle}}', { featureTitle: feature.title })}
            onChange={(event) => setLabsFeatureOverride(feature.key, event.currentTarget.checked)}
          />
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <Text variant="code" color="secondary">
            {feature.key}
          </Text>
          {feature.isOverridden && (
            <Badge color="purple" text={t('labs.custom-choice-badge', 'Custom choice')} icon="sliders-v-alt" />
          )}
          {feature.defaultEnabled && <Badge color="green" text={t('labs.default-on-badge', 'On by default')} />}
          {feature.hiddenFromDocs && <Badge color="darkgrey" text={t('labs.internal-badge', 'Internal')} />}
          {feature.requiresRestart && (
            <Badge color="orange" text={t('labs.restart-required-badge', 'Restart required')} />
          )}
        </Stack>

        <div className={styles.cardFooter}>
          <Text color="secondary" variant="bodySmall">
            {feature.codeowner ? (
              t('labs.owner-label', 'Owned by {{owner}}', { owner: feature.codeowner })
            ) : (
              <Trans i18nKey="labs.owner-unknown-label">Owner not listed</Trans>
            )}
          </Text>
          <Button
            size="sm"
            variant="secondary"
            fill="text"
            disabled={!feature.isOverridden}
            onClick={() => resetLabsFeatureOverride(feature.key)}
          >
            <Trans i18nKey="labs.reset-feature-button">Reset</Trans>
          </Button>
        </div>
      </Stack>
    </Card>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.stat}>
      <Text element="span" variant="h2">
        {value}
      </Text>
      <Text color="secondary">{label}</Text>
    </div>
  );
}

function useLocalFlagOverrides(): FlagOverrides {
  const [overrides, setOverrides] = useState<FlagOverrides>(() => getLocalStorageProvider().getFlags());

  useEffect(() => {
    const loadOverrides = () => setOverrides({ ...getLocalStorageProvider().getFlags() });

    getLocalStorageProvider().events.addHandler(ClientProviderEvents.ConfigurationChanged, loadOverrides);
    return () => {
      getLocalStorageProvider().events.removeHandler(ClientProviderEvents.ConfigurationChanged, loadOverrides);
    };
  }, []);

  return overrides;
}

function getBooleanOverride(overrides: FlagOverrides, key: string): boolean | undefined {
  const value = overrides[key];

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return undefined;
}

function setLabsFeatureOverride(key: string, enabled: boolean) {
  getLocalStorageProvider().setFlags({ [key]: enabled });
}

function resetLabsFeatureOverride(key: string) {
  getLocalStorageProvider().setFlags({ [key]: undefined });
}

function resetAllLabsOverrides() {
  getLocalStorageProvider().setFlags(Object.fromEntries(labsFeatures.map((feature) => [feature.key, undefined])));
}

function filterFeatures(
  features: LabsFeatureWithState[],
  query: string,
  filter: LabsFeatureFilter
): LabsFeatureWithState[] {
  const normalizedQuery = query.trim().toLowerCase();

  return features.filter((feature) => {
    if (filter === 'enabled' && !feature.enabled) {
      return false;
    }

    if (filter === 'overridden' && !feature.isOverridden) {
      return false;
    }

    if (filter !== 'all' && filter !== 'enabled' && filter !== 'overridden' && feature.stage !== filter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [feature.title, feature.description, feature.key, feature.codeowner]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedQuery));
  });
}

function getFilterLabel(filter: LabsFeatureFilter): string {
  switch (filter) {
    case 'all':
      return t('labs.filter-all', 'All');
    case 'enabled':
      return t('labs.filter-enabled', 'Enabled');
    case 'overridden':
      return t('labs.filter-overridden', 'Customized');
    case 'preview':
      return t('labs.filter-preview', 'Preview');
    case 'privatePreview':
      return t('labs.filter-private-preview', 'Private preview');
    case 'experimental':
      return t('labs.filter-experimental', 'Experimental');
  }
}

const getStyles = (theme: GrafanaTheme2) => {
  const cardBorder = `1px solid ${theme.colors.border.weak}`;

  return {
    hero: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      gap: theme.spacing(3),
      padding: theme.spacing(4),
      border: cardBorder,
      borderRadius: theme.shape.radius.lg,
      background: `linear-gradient(135deg, ${theme.colors.background.secondary}, ${theme.colors.background.canvas})`,
      boxShadow: theme.shadows.z1,

      [theme.breakpoints.down('md')]: {
        gridTemplateColumns: '1fr',
      },
    }),
    heroContent: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      maxWidth: theme.spacing(82),
    }),
    heroStats: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(112px, 1fr))',
      gap: theme.spacing(1),
      alignSelf: 'stretch',

      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
      },
    }),
    stat: css({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: theme.spacing(12),
      padding: theme.spacing(2),
      border: cardBorder,
      borderRadius: theme.shape.radius.default,
      background: theme.colors.background.primary,
    }),
    controlsCard: css({
      padding: theme.spacing(2),
      border: cardBorder,
      borderRadius: theme.shape.radius.default,
    }),
    filters: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
    }),
    featureGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: theme.spacing(2),

      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
      },
    }),
    featureCard: css({
      minHeight: '100%',
      padding: theme.spacing(2),
      border: cardBorder,
      borderRadius: theme.shape.radius.default,
      background: theme.colors.background.primary,

      '&:hover': {
        borderColor: theme.colors.border.medium,
        boxShadow: theme.shadows.z1,
        transform: 'translateY(-1px)',
      },
    }),
    featureCardEnabled: css({
      minHeight: '100%',
      padding: theme.spacing(2),
      border: `1px solid ${theme.colors.success.border}`,
      borderRadius: theme.shape.radius.default,
      background: theme.colors.background.primary,
      boxShadow: `inset 4px 0 0 ${theme.colors.success.main}`,

      '&:hover': {
        borderColor: theme.colors.success.main,
        boxShadow: `${theme.shadows.z1}, inset 4px 0 0 ${theme.colors.success.main}`,
        transform: 'translateY(-1px)',
      },
    }),
    cardFooter: css({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing(1),
      paddingTop: theme.spacing(1),
      borderTop: cardBorder,
    }),
    emptyState: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(6),
      border: cardBorder,
      borderRadius: theme.shape.radius.default,
      textAlign: 'center',
    }),
  };
};

export default LabsPage;
