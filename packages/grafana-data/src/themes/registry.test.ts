import { getThemeById, getBuiltInThemes } from './registry';

describe('getThemeById', () => {
	it('returns same object reference for same theme ID (caching works)', () => {
		const theme1 = getThemeById('dark');
		const theme2 = getThemeById('dark');
		expect(theme1).toBe(theme2); // Same reference, not just equal values
	});

	it('returns same reference for light theme', () => {
		const theme1 = getThemeById('light');
		const theme2 = getThemeById('light');
		expect(theme1).toBe(theme2);
	});

	it('returns different references for different theme IDs', () => {
		const darkTheme = getThemeById('dark');
		const lightTheme = getThemeById('light');
		expect(darkTheme).not.toBe(lightTheme);
		expect(darkTheme.colors.mode).toBe('dark');
		expect(lightTheme.colors.mode).toBe('light');
	});

	it('caches experimental themes correctly', () => {
		const theme1 = getThemeById('synthwave');
		const theme2 = getThemeById('synthwave');
		expect(theme1).toBe(theme2);
		expect(theme1.name).toBe('Synthwave');
	});

	it('falls back to dark theme for unknown ID', () => {
		const theme = getThemeById('nonexistent-theme-id');
		expect(theme.colors.mode).toBe('dark');
	});

	it('returns correct theme properties', () => {
		const darkTheme = getThemeById('dark');
		expect(darkTheme.isDark).toBe(true);
		expect(darkTheme.isLight).toBe(false);
		expect(darkTheme.colors).toBeDefined();
		expect(darkTheme.spacing).toBeDefined();
		expect(darkTheme.typography).toBeDefined();
	});
});

describe('getBuiltInThemes', () => {
	it('returns base themes when no extras allowed', () => {
		const themes = getBuiltInThemes([]);
		const themeIds = themes.map((t) => t.id);
		expect(themeIds).toContain('dark');
		expect(themeIds).toContain('light');
		expect(themeIds).toContain('system');
		// Should not contain extra themes
		expect(themeIds).not.toContain('synthwave');
	});

	it('includes allowed extra themes', () => {
		const themes = getBuiltInThemes(['synthwave', 'tron']);
		const themeIds = themes.map((t) => t.id);
		expect(themeIds).toContain('synthwave');
		expect(themeIds).toContain('tron');
		// Should not contain non-allowed extras
		expect(themeIds).not.toContain('matrix');
	});
});
