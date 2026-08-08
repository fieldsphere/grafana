export function getPerpendicularUnitVector(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;

  return { nx: -dy / len, ny: dx / len };
}

export function getDoubleLineSeparation(strokeWidth: number): number {
  return Math.max(strokeWidth * 1.25, 3);
}

export function getParallelLineCoords(x1: number, y1: number, x2: number, y2: number, separation: number) {
  const { nx, ny } = getPerpendicularUnitVector(x1, y1, x2, y2);
  const half = separation / 2;

  return {
    line1: {
      x1: x1 + nx * half,
      y1: y1 + ny * half,
      x2: x2 + nx * half,
      y2: y2 + ny * half,
    },
    line2: {
      x1: x1 - nx * half,
      y1: y1 - ny * half,
      x2: x2 - nx * half,
      y2: y2 - ny * half,
    },
  };
}

export function offsetPathBySampling(pathD: string, offset: number, sampleCount = 50) {
  if (typeof document === 'undefined') {
    return { positive: pathD, negative: pathD };
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);

  const length = path.getTotalLength();
  if (length === 0) {
    return { positive: pathD, negative: pathD };
  }

  const points1: string[] = [];
  const points2: string[] = [];
  const half = offset / 2;

  for (let i = 0; i <= sampleCount; i++) {
    const distance = (i / sampleCount) * length;
    const point = path.getPointAtLength(distance);
    const pointBefore = path.getPointAtLength(Math.max(0, distance - 0.5));
    const pointAfter = path.getPointAtLength(Math.min(length, distance + 0.5));
    const dx = pointAfter.x - pointBefore.x;
    const dy = pointAfter.y - pointBefore.y;
    const segmentLength = Math.hypot(dx, dy) || 1;
    const nx = -dy / segmentLength;
    const ny = dx / segmentLength;
    const command = i === 0 ? 'M' : 'L';

    points1.push(`${command}${point.x + nx * half} ${point.y + ny * half}`);
    points2.push(`${command}${point.x - nx * half} ${point.y - ny * half}`);
  }

  return {
    positive: points1.join(' '),
    negative: points2.join(' '),
  };
}
