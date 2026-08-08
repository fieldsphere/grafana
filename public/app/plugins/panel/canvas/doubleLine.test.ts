import {
  getDoubleLineSeparation,
  getParallelLineCoords,
  getPerpendicularUnitVector,
} from './components/connections/doubleLineUtils';
import { LineStyle, StrokeDasharray } from './types';
import { getStrokeDasharray } from './utils';

describe('canvas utils', () => {
  describe('getStrokeDasharray', () => {
    it('returns dashed pattern for dashed style', () => {
      expect(getStrokeDasharray(LineStyle.Dashed)).toBe(StrokeDasharray.Dashed);
    });

    it('returns dotted pattern for dotted style', () => {
      expect(getStrokeDasharray(LineStyle.Dotted)).toBe(StrokeDasharray.Dotted);
    });

    it('returns solid pattern for solid style', () => {
      expect(getStrokeDasharray(LineStyle.Solid)).toBe(StrokeDasharray.Solid);
    });

    it('returns solid pattern for double style', () => {
      expect(getStrokeDasharray(LineStyle.Double)).toBe(StrokeDasharray.Solid);
    });
  });
});

describe('double line utils', () => {
  describe('getPerpendicularUnitVector', () => {
    it('returns perpendicular vector for horizontal line', () => {
      const { nx, ny } = getPerpendicularUnitVector(0, 0, 10, 0);
      expect(nx).toBeCloseTo(0);
      expect(ny).toBe(1);
    });

    it('returns perpendicular vector for vertical line', () => {
      expect(getPerpendicularUnitVector(0, 0, 0, 10)).toEqual({ nx: -1, ny: 0 });
    });
  });

  describe('getDoubleLineSeparation', () => {
    it('uses a minimum separation for thin strokes', () => {
      expect(getDoubleLineSeparation(1)).toBe(3);
    });

    it('scales separation with stroke width', () => {
      expect(getDoubleLineSeparation(8)).toBe(10);
    });
  });

  describe('getParallelLineCoords', () => {
    it('offsets lines equally on both sides of the center line', () => {
      const { line1, line2 } = getParallelLineCoords(0, 0, 10, 0, 4);

      expect(line1).toEqual({ x1: 0, y1: 2, x2: 10, y2: 2 });
      expect(line2).toEqual({ x1: 0, y1: -2, x2: 10, y2: -2 });
    });
  });
});
