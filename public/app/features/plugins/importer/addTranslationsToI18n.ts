import { DEFAULT_LANGUAGE } from '@grafana/i18n';
import { addResourceBundle } from '@grafana/i18n/internal';

import { SystemJS } from '../loader/systemjs';
import { resolveModulePath } from '../loader/utils';

import { createStructuredLogger } from '@grafana/data';
const logger = createStructuredLogger('features.plugins');

interface AddTranslationsToI18nOptions {
  resolvedLanguage: string;
  fallbackLanguage: string;
  pluginId: string;
  translations: Record<string, string>;
}

export async function addTranslationsToI18n({
  resolvedLanguage,
  fallbackLanguage,
  pluginId,
  translations,
}: AddTranslationsToI18nOptions): Promise<void> {
  if (resolvedLanguage === DEFAULT_LANGUAGE) {
    return;
  }

  const resolvedPath = translations[resolvedLanguage];
  const fallbackPath = translations[fallbackLanguage];
  const path = resolvedPath ?? fallbackPath;

  if (!path) {
    logger.warn(`Could not find any translation for plugin ${pluginId}`, { resolvedLanguage, fallbackLanguage });
    return;
  }

  try {
    const module = await SystemJS.import(resolveModulePath(path));
    if (!module.default) {
      logger.warn(`Could not find default export for plugin ${pluginId}`, {
        resolvedLanguage,
        fallbackLanguage,
        path,
      });
      return;
    }

    const language = resolvedPath ? resolvedLanguage : fallbackLanguage;
    addResourceBundle(language, pluginId, module.default);
  } catch (error) {
    logger.warn(`Could not load translation for plugin ${pluginId}`, {
      resolvedLanguage,
      fallbackLanguage,
      error,
      path,
    });
  }
}
