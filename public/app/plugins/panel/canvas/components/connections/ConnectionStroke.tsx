import { type CSSProperties, type ReactNode } from 'react';

import { LineStyle } from '../../types';

import { getDoubleLineSeparation, getParallelLineCoords, offsetPathBySampling } from './doubleLineUtils';

interface SharedStrokeProps {
  stroke: string;
  strokeWidth: number;
  lineStyleType: LineStyle;
  strokeDasharray?: string;
  shouldAnimate?: boolean;
  getAnimationDirection?: () => string;
  markerEnd?: string;
  markerStart?: string;
  id?: string;
  cursor?: string;
  pointerEvents?: string;
  style?: CSSProperties;
}

interface ConnectionLineStrokeProps extends SharedStrokeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface ConnectionPathStrokeProps extends SharedStrokeProps {
  pathD: string;
}

const renderAnimation = (shouldAnimate?: boolean, getAnimationDirection?: () => string): ReactNode => {
  if (!shouldAnimate || !getAnimationDirection) {
    return null;
  }

  return (
    <animate
      attributeName="stroke-dashoffset"
      values={getAnimationDirection()}
      dur="5s"
      calcMode="linear"
      repeatCount="indefinite"
      fill="freeze"
    />
  );
};

export const ConnectionLineStroke = ({
  x1,
  y1,
  x2,
  y2,
  stroke,
  strokeWidth,
  lineStyleType,
  strokeDasharray,
  shouldAnimate,
  getAnimationDirection,
  markerEnd,
  markerStart,
  id,
  cursor,
  pointerEvents,
  style,
}: ConnectionLineStrokeProps) => {
  if (lineStyleType !== LineStyle.Double) {
    return (
      <line
        id={id}
        stroke={stroke}
        pointerEvents={pointerEvents}
        strokeWidth={strokeWidth}
        markerEnd={markerEnd}
        markerStart={markerStart}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={1}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        cursor={cursor}
        style={style}
      >
        {renderAnimation(shouldAnimate, getAnimationDirection)}
      </line>
    );
  }

  const halfWidth = strokeWidth / 2;
  const separation = getDoubleLineSeparation(strokeWidth);
  const { line1, line2 } = getParallelLineCoords(x1, y1, x2, y2, separation);

  return (
    <>
      <line
        id={id}
        stroke={stroke}
        pointerEvents={pointerEvents}
        strokeWidth={halfWidth}
        markerEnd={markerEnd}
        markerStart={markerStart}
        x1={line1.x1}
        y1={line1.y1}
        x2={line1.x2}
        y2={line1.y2}
        cursor={cursor}
        style={style}
      />
      <line
        id={id}
        stroke={stroke}
        pointerEvents={pointerEvents}
        strokeWidth={halfWidth}
        x1={line2.x1}
        y1={line2.y1}
        x2={line2.x2}
        y2={line2.y2}
        cursor={cursor}
        style={style}
      />
    </>
  );
};

export const ConnectionPathStroke = ({
  pathD,
  stroke,
  strokeWidth,
  lineStyleType,
  strokeDasharray,
  shouldAnimate,
  getAnimationDirection,
  markerEnd,
  markerStart,
  cursor,
  pointerEvents,
  style,
}: ConnectionPathStrokeProps) => {
  if (lineStyleType !== LineStyle.Double) {
    return (
      <path
        d={pathD}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={1}
        fill="none"
        markerEnd={markerEnd}
        markerStart={markerStart}
        cursor={cursor}
        pointerEvents={pointerEvents}
        style={style}
      >
        {renderAnimation(shouldAnimate, getAnimationDirection)}
      </path>
    );
  }

  const halfWidth = strokeWidth / 2;
  const separation = getDoubleLineSeparation(strokeWidth);
  const { positive, negative } = offsetPathBySampling(pathD, separation);

  return (
    <>
      <path
        d={positive}
        stroke={stroke}
        strokeWidth={halfWidth}
        fill="none"
        markerEnd={markerEnd}
        markerStart={markerStart}
        cursor={cursor}
        pointerEvents={pointerEvents}
        style={style}
      />
      <path
        d={negative}
        stroke={stroke}
        strokeWidth={halfWidth}
        fill="none"
        cursor={cursor}
        pointerEvents={pointerEvents}
        style={style}
      />
    </>
  );
};
