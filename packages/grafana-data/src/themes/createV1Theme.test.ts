import { createTheme } from './createTheme';
import { createV1Theme } from './createV1Theme';

describe('createV1Theme', () => {
  const theme = createTheme();
  const v1Theme = createV1Theme(theme);

  describe('typography.heading', () => {
    it('maps v2 h1-h6 fontSize values into v1 heading properties', () => {
      expect(v1Theme.typography.heading.h1).toBe(theme.typography.h1.fontSize);
      expect(v1Theme.typography.heading.h2).toBe(theme.typography.h2.fontSize);
      expect(v1Theme.typography.heading.h3).toBe(theme.typography.h3.fontSize);
      expect(v1Theme.typography.heading.h4).toBe(theme.typography.h4.fontSize);
      expect(v1Theme.typography.heading.h5).toBe(theme.typography.h5.fontSize);
      expect(v1Theme.typography.heading.h6).toBe(theme.typography.h6.fontSize);
    });

    it('v1 heading.h5 matches v2 typography.h5.fontSize', () => {
      expect(v1Theme.typography.heading.h5).toBe(theme.typography.h5.fontSize);
    });
  });

  describe('typography.size', () => {
    it('maps v2 size values into v1 size properties', () => {
      expect(v1Theme.typography.size.xs).toBe(theme.typography.size.xs);
      expect(v1Theme.typography.size.sm).toBe(theme.typography.size.sm);
      expect(v1Theme.typography.size.md).toBe(theme.typography.size.md);
      expect(v1Theme.typography.size.lg).toBe(theme.typography.size.lg);
    });
  });

  describe('typography.fontFamily', () => {
    it('maps v2 font families into v1 font family properties', () => {
      expect(v1Theme.typography.fontFamily.sansSerif).toBe(theme.typography.fontFamily);
      expect(v1Theme.typography.fontFamily.monospace).toBe(theme.typography.fontFamilyMonospace);
    });
  });
});
