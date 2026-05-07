import { getBuiltInThemes } from '@grafana/data';
import { config } from '@grafana/runtime';

export function getSelectableThemes() {
  // Purple/amethyst (CUR-54): available without Grafanacon bundle; GrafanaCon extras still flag-gated
  const allowedExtraThemes = ['aubergine'];

  if (config.featureToggles.colorblindThemes) {
    allowedExtraThemes.push('deuteranopia_protanopia_dark');
    allowedExtraThemes.push('deuteranopia_protanopia_light');
    allowedExtraThemes.push('tritanopia_dark');
    allowedExtraThemes.push('tritanopia_light');
  }

  if (config.featureToggles.grafanaconThemes) {
    allowedExtraThemes.push('desertbloom');
    allowedExtraThemes.push('gildedgrove');
    allowedExtraThemes.push('sapphiredusk');
    allowedExtraThemes.push('tron');
    allowedExtraThemes.push('gloom');
  }

  return getBuiltInThemes(allowedExtraThemes);
}
