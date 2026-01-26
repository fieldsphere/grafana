import { getBuiltInThemes } from '@grafana/data';
import { config } from '@grafana/runtime';

let cachedThemes: ReturnType<typeof getBuiltInThemes> | null = null;
let cachedKey: string | null = null;

export function getSelectableThemes() {
  const key = config.featureToggles.grafanaconThemes ? 'grafanaconThemes:on' : 'grafanaconThemes:off';
  if (cachedThemes && cachedKey === key) {
    return cachedThemes;
  }

  const allowedExtraThemes = [];

  if (config.featureToggles.grafanaconThemes) {
    allowedExtraThemes.push('desertbloom');
    allowedExtraThemes.push('gildedgrove');
    allowedExtraThemes.push('sapphiredusk');
    allowedExtraThemes.push('tron');
    allowedExtraThemes.push('gloom');
  }

  cachedThemes = getBuiltInThemes(allowedExtraThemes);
  cachedKey = key;
  return cachedThemes;
}
