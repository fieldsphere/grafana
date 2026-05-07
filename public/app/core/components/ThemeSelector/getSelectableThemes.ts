import { getBuiltInThemes } from '@grafana/data';
import { config } from '@grafana/runtime';

export function getSelectableThemes() {
  // Purple/amethyst (CUR-54): available without Grafanacon bundle; GrafanaCon extras still flag-gated
  const colorblindExtras: string[] = config.featureToggles.colorblindThemes
    ? [
        'deuteranopia_protanopia_dark',
        'deuteranopia_protanopia_light',
        'tritanopia_dark',
        'tritanopia_light',
      ]
    : [];

  const grafanaconExtras: string[] = config.featureToggles.grafanaconThemes
    ? ['desertbloom', 'gildedgrove', 'sapphiredusk', 'tron', 'gloom']
    : [];

  return getBuiltInThemes(['aubergine', ...colorblindExtras, ...grafanaconExtras]);
}
