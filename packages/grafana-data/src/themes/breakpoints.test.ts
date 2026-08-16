import { createBreakpoints, type ThemeBreakpointsKey } from './breakpoints';

describe('createBreakpoints', () => {
  const breakpoints = createBreakpoints();
  const keys: ThemeBreakpointsKey[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

  describe('up()', () => {
    it('should generate min-width media queries for all keys', () => {
      expect(breakpoints.up('xs')).toBe('@media (min-width:0px)');
      expect(breakpoints.up('sm')).toBe('@media (min-width:544px)');
      expect(breakpoints.up('md')).toBe('@media (min-width:769px)');
      expect(breakpoints.up('lg')).toBe('@media (min-width:992px)');
      expect(breakpoints.up('xl')).toBe('@media (min-width:1200px)');
      expect(breakpoints.up('xxl')).toBe('@media (min-width:1440px)');
    });

    it('should support numeric input', () => {
      expect(breakpoints.up(500)).toBe('@media (min-width:500px)');
    });
  });

  describe('down()', () => {
    it('should generate max-width media queries for all keys', () => {
      expect(breakpoints.down('xs')).toBe('@media (max-width:-0.05px)');
      expect(breakpoints.down('sm')).toBe('@media (max-width:543.95px)');
      expect(breakpoints.down('md')).toBe('@media (max-width:768.95px)');
      expect(breakpoints.down('lg')).toBe('@media (max-width:991.95px)');
      expect(breakpoints.down('xl')).toBe('@media (max-width:1199.95px)');
      expect(breakpoints.down('xxl')).toBe('@media (max-width:1439.95px)');
    });

    it('should support numeric input', () => {
      expect(breakpoints.down(500)).toBe('@media (max-width:499.95px)');
    });
  });

  describe('between()', () => {
    it('should generate media query ranges for all adjacent key pairs', () => {
      for (let i = 0; i < keys.length - 1; i++) {
        const start = keys[i];
        const end = keys[i + 1];
        const min = breakpoints.values[start];
        const max = breakpoints.values[end] - 0.05;
        expect(breakpoints.between(start, end)).toBe(`@media (min-width:${min}px) and (max-width:${max}px)`);
      }
    });

    it('should support numeric input', () => {
      expect(breakpoints.between(500, 1000)).toBe('@media (min-width:500px) and (max-width:999.95px)');
    });
  });

  describe('only()', () => {
    it('should map each key to a single tier range', () => {
      expect(breakpoints.only('xs')).toBe('@media (min-width:0px) and (max-width:543.95px)');
      expect(breakpoints.only('sm')).toBe('@media (min-width:544px) and (max-width:768.95px)');
      expect(breakpoints.only('md')).toBe('@media (min-width:769px) and (max-width:991.95px)');
      expect(breakpoints.only('lg')).toBe('@media (min-width:992px) and (max-width:1199.95px)');
      expect(breakpoints.only('xl')).toBe('@media (min-width:1200px) and (max-width:1439.95px)');
    });

    it('should fall back to up() for highest key without upper bound', () => {
      expect(breakpoints.only('xxl')).toBe('@media (min-width:1440px)');
    });

    it('should support numeric input by delegating to up()', () => {
      expect(breakpoints.only(500)).toBe('@media (min-width:500px)');
    });
  });

  describe('container helpers', () => {
    describe('up()', () => {
      it('should generate min-width container queries for all keys', () => {
        expect(breakpoints.container.up('xs')).toBe('@container (width >= 0px)');
        expect(breakpoints.container.up('sm')).toBe('@container (width >= 544px)');
        expect(breakpoints.container.up('md')).toBe('@container (width >= 769px)');
        expect(breakpoints.container.up('lg')).toBe('@container (width >= 992px)');
        expect(breakpoints.container.up('xl')).toBe('@container (width >= 1200px)');
        expect(breakpoints.container.up('xxl')).toBe('@container (width >= 1440px)');
      });

      it('should support numeric input and optional container name', () => {
        expect(breakpoints.container.up(500, 'grid')).toBe('@container grid (width >= 500px)');
      });
    });

    describe('down()', () => {
      it('should generate max-width container queries for all keys', () => {
        expect(breakpoints.container.down('xs')).toBe('@container (width < 0px)');
        expect(breakpoints.container.down('sm')).toBe('@container (width < 544px)');
        expect(breakpoints.container.down('md')).toBe('@container (width < 769px)');
        expect(breakpoints.container.down('lg')).toBe('@container (width < 992px)');
        expect(breakpoints.container.down('xl')).toBe('@container (width < 1200px)');
        expect(breakpoints.container.down('xxl')).toBe('@container (width < 1440px)');
      });

      it('should support numeric input and optional container name', () => {
        expect(breakpoints.container.down(500, 'grid')).toBe('@container grid (width < 500px)');
      });
    });

    describe('between()', () => {
      it('should generate container query ranges for all adjacent key pairs', () => {
        for (let i = 0; i < keys.length - 1; i++) {
          const start = keys[i];
          const end = keys[i + 1];
          const min = breakpoints.values[start];
          const max = breakpoints.values[end];
          expect(breakpoints.container.between(start, end)).toBe(`@container (width >= ${min}px) and (width < ${max}px)`);
        }
      });

      it('should support numeric input and optional container name', () => {
        expect(breakpoints.container.between(500, 1000, 'grid')).toBe('@container grid (width >= 500px) and (width < 1000px)');
      });
    });

    describe('only()', () => {
      it('should map each key to a single tier container query range', () => {
        expect(breakpoints.container.only('xs')).toBe('@container (width >= 0px) and (width < 544px)');
        expect(breakpoints.container.only('sm')).toBe('@container (width >= 544px) and (width < 769px)');
        expect(breakpoints.container.only('md')).toBe('@container (width >= 769px) and (width < 992px)');
        expect(breakpoints.container.only('lg')).toBe('@container (width >= 992px) and (width < 1200px)');
        expect(breakpoints.container.only('xl')).toBe('@container (width >= 1200px) and (width < 1440px)');
      });

      it('should fall back to up() for highest key without upper bound', () => {
        expect(breakpoints.container.only('xxl')).toBe('@container (width >= 1440px)');
      });

      it('should support numeric input by delegating to up()', () => {
        expect(breakpoints.container.only(500, 'grid')).toBe('@container grid (width >= 500px)');
      });
    });
  });
});
