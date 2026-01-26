jest.mock('@grafana/runtime', () => {
  return {
    ThemeChangedEvent: class ThemeChangedEvent {},
    config: {
      theme2: { colors: { mode: 'dark' } },
      bootData: {
        assets: {
          dark: '/public/build/grafana.dark.css',
          light: '/public/build/grafana.light.css',
        },
      },
    },
  };
});

jest.mock('../app_events', () => ({
  appEvents: {
    publish: jest.fn(),
    subscribe: jest.fn(),
  },
}));

jest.mock('../services/context_srv', () => ({
  contextSrv: {
    isSignedIn: false,
  },
}));

jest.mock('./PreferencesService', () => ({
  PreferencesService: jest.fn(),
}));

jest.mock('@grafana/data/internal', () => ({
  getThemeById: jest.fn(),
}));

// Use require to ensure mocks above apply before importing the module under test.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { config } = require('@grafana/runtime');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { warmThemeCssCache } = require('./theme');

describe('warmThemeCssCache', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.head.innerHTML = '';
    config.theme2.colors.mode = 'dark';
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

