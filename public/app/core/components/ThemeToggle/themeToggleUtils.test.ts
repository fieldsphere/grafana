import {
  getTargetThemeId,
  getThemeToggleAriaLabel,
  getThemeToggleIcon,
  getThemeToggleTooltip,
} from './themeToggleUtils';

describe('themeToggleUtils', () => {
  describe('getThemeToggleIcon', () => {
    it('returns lightbulb-alt when switching from dark to light', () => {
      expect(getThemeToggleIcon(true)).toBe('lightbulb-alt');
    });

    it('returns adjust-circle when switching from light to dark', () => {
      expect(getThemeToggleIcon(false)).toBe('adjust-circle');
    });
  });

  describe('getTargetThemeId', () => {
    it('returns light when current theme is dark', () => {
      expect(getTargetThemeId(true)).toBe('light');
    });

    it('returns dark when current theme is light', () => {
      expect(getTargetThemeId(false)).toBe('dark');
    });
  });

  describe('getThemeToggleAriaLabel', () => {
    it('describes switching to light when dark', () => {
      expect(getThemeToggleAriaLabel(true)).toBe('Switch to light theme');
    });

    it('describes switching to dark when light', () => {
      expect(getThemeToggleAriaLabel(false)).toBe('Switch to dark theme');
    });
  });

  describe('getThemeToggleTooltip', () => {
    it('mentions light theme and keyboard shortcut when dark', () => {
      expect(getThemeToggleTooltip(true)).toContain('Light');
      expect(getThemeToggleTooltip(true)).toContain('c t');
    });

    it('mentions dark theme and keyboard shortcut when light', () => {
      expect(getThemeToggleTooltip(false)).toContain('Dark');
      expect(getThemeToggleTooltip(false)).toContain('c t');
    });
  });
});
