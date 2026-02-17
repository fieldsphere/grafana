import { addResourceBundle } from '@grafana/i18n/internal';

import { SystemJS } from '../loader/systemjs';
import { resolveModulePath } from '../loader/utils';

import { structuredLogFromConsole } from 'app/core/logging/structuredConsole';
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
    structuredLogFromConsole('warn', `Could not find any translation for plugin ${pluginId}`, { resolvedLanguage, fallbackLanguage });
    return;
  }

  try {
    const module = await SystemJS.import(resolveModulePath(path));
    if (!module.default) {
      structuredLogFromConsole('warn', `Could not find default export for plugin ${pluginId}`, {
        resolvedLanguage,
        fallbackLanguage,
        path,
      });
      return;
    }

    const language = resolvedPath ? resolvedLanguage : fallbackLanguage;
    addResourceBundle(language, pluginId, module.default);
  } catch (error) {
    structuredLogFromConsole('warn', `Could not load translation for plugin ${pluginId}`, {
      resolvedLanguage,
      fallbackLanguage,
      error,
      path,
    });
  }
}
