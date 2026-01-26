import { getThemeById } from '@grafana/data/internal';
import { config, ThemeChangedEvent } from '@grafana/runtime';

import { appEvents } from '../app_events';
import { contextSrv } from '../services/context_srv';

import { PreferencesService } from './PreferencesService';

type ThemeMode = 'light' | 'dark';

function getThemeCssHref(mode: ThemeMode): string | undefined {
  return config.bootData?.assets?.[mode];
}

function findExistingThemeLink(mode: ThemeMode): HTMLLinkElement | null {
  const tagged = document.querySelector(`link[rel="stylesheet"][data-grafana-theme-mode="${mode}"]`);
  if (tagged) {
    return tagged as HTMLLinkElement;
  }

  // Backfill the attribute on existing theme link if we can match it.
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
  for (const link of links) {
    if (link.href && link.href.includes(`build/grafana.${mode}`)) {
      link.dataset.grafanaThemeMode = mode;
      return link;
    }
  }

  return null;
}

function ensureThemeStylesheet(mode: ThemeMode): HTMLLinkElement | null {
  const href = getThemeCssHref(mode);
  if (!href) {
    return null;
  }

  const existing = findExistingThemeLink(mode);
  if (existing) {
    return existing;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.grafanaThemeMode = mode;
  // Start in a non-applied state; caller decides when to apply.
  link.media = 'not all';
  document.head.insertBefore(link, document.head.firstChild);
  return link;
}

export function preloadThemeCss(mode: ThemeMode) {
  // Ensure the stylesheet exists and is fetched+parsed without applying.
  const link = ensureThemeStylesheet(mode);
  if (link) {
    link.media = 'not all';
  }
}

export async function changeTheme(themeId: string, runtimeOnly?: boolean) {
  const oldTheme = config.theme2;

  const newTheme = getThemeById(themeId);

  appEvents.publish(new ThemeChangedEvent(newTheme));

  // Add css file for new theme
  if (oldTheme.colors.mode !== newTheme.colors.mode) {
    const oldMode = oldTheme.colors.mode as ThemeMode;
    const newMode = newTheme.colors.mode as ThemeMode;

    const oldCssLink = ensureThemeStylesheet(oldMode);
    const newCssLink = ensureThemeStylesheet(newMode);

    if (oldCssLink && newCssLink) {
      // Keep the currently applied sheet active until the new sheet is loaded, then swap by toggling media.
      oldCssLink.media = 'all';

      if (newCssLink.sheet) {
        newCssLink.media = 'all';
        oldCssLink.media = 'not all';
      } else {
        newCssLink.media = 'not all';
        newCssLink.onload = () => {
          newCssLink.media = 'all';
          oldCssLink.media = 'not all';
        };
      }
    }
  }

  if (runtimeOnly) {
    return;
  }

  if (!contextSrv.isSignedIn) {
    return;
  }

  // Persist new theme
  const service = new PreferencesService('user');
  await service.patch({
    theme: themeId,
  });
}

export async function toggleTheme(runtimeOnly: boolean) {
  const currentTheme = config.theme2;
  changeTheme(currentTheme.isDark ? 'light' : 'dark', runtimeOnly);
}
