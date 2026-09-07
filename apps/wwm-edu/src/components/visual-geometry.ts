import type { QuestionVisual } from '../engine/types';

/** Every data-dependent coordinate a diagram draws, plus the canvas it draws on.
 * Kept free of React so `scripts/check-content.ts` can assert that no generated
 * question ever places a point outside its own viewBox (an off-canvas point is
 * silently clipped in the browser — this is how the 145° arm used to vanish). */
export interface VisualGeometry {
  width: number;
  height: number;
  points: { x: number; y: number }[];
}

export interface AngleGeometry extends VisualGeometry {
  vertex: { x: number; y: number };
  armEnd: { x: number; y: number };
  ray: { x: number; y: number };
  arcStart: { x: number; y: number };
  arcEnd: { x: number; y: number };
  label: { x: number; y: number };
}

const ANGLE_VERTEX = { x: 110, y: 170 };
const ANGLE_ARM = 135;
const ANGLE_RAY = 100;
const ANGLE_ARC = 35;
const ANGLE_LABEL = 62;

export function angleGeometry(degrees: number): AngleGeometry {
  const at = (radius: number, deg: number) => ({
    x: ANGLE_VERTEX.x + Math.cos(deg * Math.PI / 180) * radius,
    y: ANGLE_VERTEX.y - Math.sin(deg * Math.PI / 180) * radius,
  });
  const vertex = ANGLE_VERTEX;
  const armEnd = { x: vertex.x + ANGLE_ARM, y: vertex.y };
  const ray = at(ANGLE_RAY, degrees);
  const arcStart = { x: vertex.x + ANGLE_ARC, y: vertex.y };
  const arcEnd = at(ANGLE_ARC, degrees);
  const label = at(ANGLE_LABEL, degrees / 2);
  return { width: 260, height: 205, vertex, armEnd, ray, arcStart, arcEnd, label, points: [vertex, armEnd, ray, arcStart, arcEnd, label] };
}

export interface ClockGeometry extends VisualGeometry {
  centre: { x: number; y: number };
  hourHand: { x: number; y: number };
  minuteHand: { x: number; y: number };
  /** One tick per minute; `major` marks the twelve hour positions. */
  ticks: { x1: number; y1: number; x2: number; y2: number; major: boolean }[];
  /** The 12/3/6/9 numerals, inside the tick ring and clear of the hands. */
  numerals: { n: number; x: number; y: number }[];
}

export function clockGeometry(hour: number, minute: number): ClockGeometry {
  const centre = { x: 110, y: 110 };
  const at = (angle: number, length: number) => ({
    x: centre.x + Math.sin(angle * Math.PI / 180) * length,
    y: centre.y - Math.cos(angle * Math.PI / 180) * length,
  });
  const minuteHand = at(minute * 6, 62);
  const hourHand = at((hour % 12) * 30 + minute / 2, 42);
  // Minute ticks: advanced questions ask for times like 10:50, which cannot be
  // read off a face that only carries the 12/3/6/9 numerals.
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const major = i % 5 === 0;
    const outer = at(i * 6, 92);
    const inner = at(i * 6, major ? 81 : 86);
    return { x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major };
  });
  const numerals = [12, 3, 6, 9].map((n) => {
    const seat = at(n * 30, 68);
    return { n, x: seat.x, y: seat.y + 5 }; // +5 shifts the text baseline onto the seat
  });
  return {
    width: 220,
    height: 220,
    centre,
    hourHand,
    minuteHand,
    ticks,
    numerals,
    points: [centre, hourHand, minuteHand, ...numerals.map(({ x, y }) => ({ x, y }))],
  };
}

export interface BarGeometry extends VisualGeometry {
  bars: { x: number; y: number; width: number; height: number; valueY: number; labelX: number }[];
}

export function barGeometry(values: readonly number[]): BarGeometry {
  const max = Math.max(...values);
  const bars = values.map((value, index) => {
    const height = value / max * 140;
    const x = 80 + index * 105;
    return { x, y: 190 - height, width: 56, height, valueY: 181 - height, labelX: x + 28 };
  });
  return {
    width: 420,
    height: 230,
    bars,
    points: bars.flatMap((bar) => [{ x: bar.x, y: bar.y }, { x: bar.x + bar.width, y: bar.y + bar.height }, { x: bar.labelX, y: bar.valueY }]),
  };
}

export interface RulerGeometry extends VisualGeometry {
  objectStart: number;
  objectEnd: number;
  rulerWidth: number;
  ticks: number[];
  marks: number[];
}

export function rulerGeometry(rulerCm: number, startCm: number, endCm: number): RulerGeometry {
  const at = (cm: number) => 20 + cm * 40;
  const ticks = Array.from({ length: rulerCm * 10 + 1 }, (_, i) => 20 + i * 4);
  const marks = Array.from({ length: rulerCm + 1 }, (_, i) => at(i));
  return {
    width: rulerCm * 40 + 50,
    height: 155,
    objectStart: at(startCm),
    objectEnd: at(endCm),
    rulerWidth: rulerCm * 40,
    ticks,
    marks,
    points: [
      { x: at(startCm), y: 18 },
      { x: at(endCm), y: 18 },
      { x: 20 + rulerCm * 40, y: 116 },
      ...marks.map((x) => ({ x, y: 100 })),
    ],
  };
}

export function visualGeometry(visual: QuestionVisual): VisualGeometry {
  switch (visual.type) {
    case 'angle': return angleGeometry(visual.degrees);
    case 'clock': return clockGeometry(visual.hour, visual.minute);
    case 'bar-chart': return barGeometry(visual.values);
    case 'ruler': return rulerGeometry(visual.rulerCm, visual.startCm, visual.endCm);
  }
}
