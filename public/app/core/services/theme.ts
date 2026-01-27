import { getThemeById } from '@grafana/data/internal';
import { config, ThemeChangedEvent } from '@grafana/runtime';

import { appEvents } from '../app_events';
import { contextSrv } from '../services/context_srv';

import { PreferencesService } from './PreferencesService';

function scheduleIdle(cb: () => void) {
  // requestIdleCallback is best-effort and not supported in all browsers.
  // Fallback ensures we still warm the cache shortly after mount.
  if ('requestIdleCallback' in window) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (window as unknown as { requestIdleCallback: (fn: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
      cb,
      { timeout: 5000 }
    );
    return;
  }

  window.setTimeout(cb, 0);
}

function canUseLinkRel(rel: string): boolean {
  const link = document.createElement('link');
  // relList.supports isn't implemented in all browsers.
  return Boolean(link.relList?.supports?.(rel));
}

export type ThemeCssWarmupPriority = 'idle-prefetch' | 'preload';

export interface ThemeCssWarmupOptions {
  priority?: ThemeCssWarmupPriority;
}

/**
 * Warms the HTTP cache for the opposite theme CSS file so that the first theme switch doesn't have
 * to pay the network + parse cost.
 */
export function warmThemeCssCache(options: ThemeCssWarmupOptions = {}) {
  const currentMode = config.theme2.colors.mode;
  const otherMode = currentMode === 'dark' ? 'light' : 'dark';
  const href = config.bootData.assets[otherMode];

  if (!href) {
    return;
  }

  const doWarm = () => {
    const existing = Array.from(
      document.querySelectorAll<HTMLLinkElement>(`link[data-grafana-theme-warm="${otherMode}"]`)
    ).some((link) => link.getAttribute('href') === href);
    if (existing) {
      return;
    }

    const link = document.createElement('link');
    if (options.priority === 'preload') {
      link.rel = 'preload';
    } else {
      // Prefer prefetch to avoid competing with initial render; fallback to preload if unsupported.
      link.rel = canUseLinkRel('prefetch') ? 'prefetch' : 'preload';
    }
    link.as = 'style';
    link.href = href;
    link.dataset.grafanaThemeWarm = otherMode;
    document.head.appendChild(link);
  };

  if (options.priority === 'preload') {
    doWarm();
    return;
  }

  scheduleIdle(doWarm);
}

export async function changeTheme(themeId: string, runtimeOnly?: boolean) {
  const oldTheme = config.theme2;

  const newTheme = getThemeById(themeId);

  appEvents.publish(new ThemeChangedEvent(newTheme));

  // Add css file for new theme
  if (oldTheme.colors.mode !== newTheme.colors.mode) {
    const newCssLink = document.createElement('link');
    newCssLink.rel = 'stylesheet';
    newCssLink.href = config.bootData.assets[newTheme.colors.mode];
    newCssLink.onload = () => {
      // Remove old css file
      const bodyLinks = document.getElementsByTagName('link');
      for (let i = 0; i < bodyLinks.length; i++) {
        const link = bodyLinks[i];

        if (link.href && link.href.includes(`build/grafana.${oldTheme.colors.mode}`)) {
          // Remove existing link once the new css has loaded to avoid flickering
          // If we add new css at the same time we remove current one the page will be rendered without css
          // As the new css file is loading
          link.remove();
        }
      }
    };
    document.head.insertBefore(newCssLink, document.head.firstChild);
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
