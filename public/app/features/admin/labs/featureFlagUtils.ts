export type FeatureToggles = Record<string, boolean | undefined>;

export function getEnabledFeatureFlagNames(featureToggles: FeatureToggles): string[] {
  return Object.entries(featureToggles)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([flagName]) => flagName)
    .sort((a, b) => a.localeCompare(b));
}
