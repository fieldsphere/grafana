import { addResourceBundle } from '@grafana/i18n/internal';
import { logWarning } from '@grafana/runtime';

import { SystemJS } from '../loader/systemjs';
import { resolveModulePath } from '../loader/utils';

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
  const resolvedPath = translations[resolvedLanguage];
  const fallbackPath = translations[fallbackLanguage];
  const path = resolvedPath ?? fallbackPath;

  if (!path) {
    logWarning(`Could not find any translation for plugin ${pluginId}`, {
      pluginId,
      resolvedLanguage,
      fallbackLanguage,
    });
    return;
  }

  try {
    const module = await SystemJS.import(resolveModulePath(path));
    if (!module.default) {
      logWarning(`Could not find default export for plugin ${pluginId}`, {
        pluginId,
        resolvedLanguage,
        fallbackLanguage,
        path,
      });
      return;
    }

    const language = resolvedPath ? resolvedLanguage : fallbackLanguage;
    addResourceBundle(language, pluginId, module.default);
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logWarning(`Could not load translation for plugin ${pluginId}`, {
      pluginId,
      resolvedLanguage,
      fallbackLanguage,
      error: errorObj.message,
      path,
    });
  }
}
