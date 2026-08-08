import { FeatureState } from '@grafana/data';
import { FlagKeys } from '@grafana/runtime/internal';

import featureList from '../../../../pkg/services/featuremgmt/toggles_gen.json';

const STAGE_ORDER = ['preview', 'privatePreview', 'experimental'] as const;
const FRONTEND_FLAG_KEYS = new Set<string>(Object.values(FlagKeys));
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
const catalog: FeatureToggleCatalog = featureList;

type FeatureToggleCatalog = {
  items: FeatureToggleCatalogItem[];
};

type FeatureToggleCatalogItem = {
  metadata: {
    name: string;
  };
  spec: {
    description?: string;
    stage?: string;
    codeowner?: string;
    expression?: string;
    requiresRestart?: boolean;
    requiresDevMode?: boolean;
    hideFromDocs?: boolean;
  };
};

export type LabsFeatureStage = (typeof STAGE_ORDER)[number];

export type LabsFeature = {
  key: string;
  title: string;
  description: string;
  stage: LabsFeatureStage;
  defaultEnabled: boolean;
  codeowner?: string;
  requiresRestart: boolean;
  hiddenFromDocs: boolean;
};

export type LabsFeatureFilter = LabsFeatureStage | 'all' | 'enabled' | 'overridden';

export const labsFeatureFilters: LabsFeatureFilter[] = [
  'all',
  'enabled',
  'overridden',
  'preview',
  'privatePreview',
  'experimental',
];

export const labsFeatures: LabsFeature[] = catalog.items
  .flatMap((item) => {
    const stage = item.spec.stage;

    if (!FRONTEND_FLAG_KEYS.has(item.metadata.name) || !isLabsFeatureStage(stage) || item.spec.requiresDevMode) {
      return [];
    }

    return [
      {
        key: item.metadata.name,
        title: getFeatureTitle(item.metadata.name),
        description: item.spec.description || item.metadata.name,
        stage,
        defaultEnabled: item.spec.expression === 'true',
        codeowner: item.spec.codeowner,
        requiresRestart: item.spec.requiresRestart ?? false,
        hiddenFromDocs: item.spec.hideFromDocs ?? false,
      },
    ];
  })
  .sort((a, b) => {
    const stageSort = STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
    return stageSort || collator.compare(a.title, b.title);
  });

export function getFeatureStageState(stage: LabsFeatureStage): FeatureState {
  switch (stage) {
    case 'preview':
      return FeatureState.preview;
    case 'privatePreview':
      return FeatureState.privatePreview;
    case 'experimental':
      return FeatureState.experimental;
  }
}

function getFeatureTitle(key: string): string {
  const spaced = key
    .replace(/\./g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim();

  return spaced
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isLabsFeatureStage(stage: string | undefined): stage is LabsFeatureStage {
  return stage === 'preview' || stage === 'privatePreview' || stage === 'experimental';
}
