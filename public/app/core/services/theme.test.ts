import { getThemeById } from '@grafana/data';
import { config } from '@grafana/runtime';

import { warmThemeCssCache } from './theme';

describe('warmThemeCssCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.head.innerHTML = '';

    config.theme2 = getThemeById('dark');
    config.bootData.assets.dark = '/public/build/grafana.dark.css';
    config.bootData.assets.light = '/public/build/grafana.light.css';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('adds a warm-cache link for the opposite mode', () => {
    warmThemeCssCache();
    jest.runOnlyPendingTimers();

    const links = document.head.querySelectorAll<HTMLLinkElement>('link[data-grafana-theme-warm]');
    expect(links).toHaveLength(1);

    const link = links[0];
    expect(['preload', 'prefetch']).toContain(link.rel);
    expect(link.as).toBe('style');
    expect(link.getAttribute('href')).toBe('/public/build/grafana.light.css');
    expect(link.dataset.grafanaThemeWarm).toBe('light');
  });

  it('does not add duplicate links for the same href', () => {
    warmThemeCssCache();
    jest.runOnlyPendingTimers();

    warmThemeCssCache();
    jest.runOnlyPendingTimers();

    const links = document.head.querySelectorAll<HTMLLinkElement>('link[data-grafana-theme-warm="light"]');
    expect(links).toHaveLength(1);
  });
});

