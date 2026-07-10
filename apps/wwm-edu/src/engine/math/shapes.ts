import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { buildChoices } from '../distractors';

export const meta: GeneratorMeta = {
  id: 'shapes',
  name: { en: 'Shapes', zh: '图形' },
  icon: '📐',
  term: 2,
};

const UNITS = ['cm', 'm'] as const;

function rectanglePerimeterQuestion(rng: Rng, difficulty: Difficulty): Question {
  const unit = rng.pick(UNITS);
  const max = difficulty === 'standard' ? 30 : 100;
  const length = rng.int(2, max);
  const width = rng.int(2, max);
  const perimeter = 2 * (length + width);

  const choices = buildChoices(rng, perimeter, [
    () => length + width,
    () => length * width,
    () => perimeter + 2,
    () => perimeter - 2,
  ]);

  return {
    id: `shp-rectperim-${unit}-${length}-${width}`,
    prompt: {
      en: `A rectangle has a length of ${length} ${unit} and a width of ${width} ${unit}. What is its perimeter?`,
      zh: `一个长方形的长是 ${length} ${unit}，宽是 ${width} ${unit}。它的周长是多少？`,
    },
    choices,
    answer: String(perimeter),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `Perimeter = 2 × (${length} + ${width}) = ${perimeter} ${unit}`,
      zh: `周长 = 2 × (${length} + ${width}) = ${perimeter} ${unit}`,
    },
  };
}

function rectangleAreaQuestion(rng: Rng, difficulty: Difficulty): Question {
  const unit = rng.pick(UNITS);
  const max = difficulty === 'standard' ? 30 : 100;
  const length = rng.int(2, max);
  const width = rng.int(2, max);
  const area = length * width;

  return {
    id: `shp-rectarea-${unit}-${length}-${width}`,
    prompt: {
      en: `A rectangle has a length of ${length} ${unit} and a width of ${width} ${unit}. What is its area?`,
      zh: `一个长方形的长是 ${length} ${unit}，宽是 ${width} ${unit}。它的面积是多少？`,
    },
    answer: String(area),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `Area = ${length} × ${width} = ${area} ${unit}²`,
      zh: `面积 = ${length} × ${width} = ${area} 平方${unit === 'cm' ? '厘米' : '米'}`,
    },
  };
}

function squareQuestion(rng: Rng, difficulty: Difficulty): Question {
  const unit = rng.pick(UNITS);
  const max = difficulty === 'standard' ? 25 : 60;
  const side = rng.int(2, max);
  const askArea = rng.chance(0.5);
  const perimeter = 4 * side;
  const area = side * side;

  if (askArea) {
    return {
      id: `shp-sqarea-${unit}-${side}`,
      prompt: {
        en: `A square has sides of ${side} ${unit}. What is its area?`,
        zh: `一个正方形的边长是 ${side} ${unit}。它的面积是多少？`,
      },
      answer: String(area),
      kind: 'numeric',
      topic: meta.id,
      explain: { en: `Area = ${side} × ${side} = ${area} ${unit}²`, zh: `面积 = ${side} × ${side} = ${area} 平方${unit === 'cm' ? '厘米' : '米'}` },
    };
  }
  return {
    id: `shp-sqperim-${unit}-${side}`,
    prompt: {
      en: `A square has sides of ${side} ${unit}. What is its perimeter?`,
      zh: `一个正方形的边长是 ${side} ${unit}。它的周长是多少？`,
    },
    answer: String(perimeter),
    kind: 'numeric',
    topic: meta.id,
    explain: { en: `Perimeter = 4 × ${side} = ${perimeter} ${unit}`, zh: `周长 = 4 × ${side} = ${perimeter} ${unit}` },
  };
}

const POLYGONS: { name: { en: string; zh: string }; sides: number }[] = [
  { name: { en: 'triangle', zh: '三角形' }, sides: 3 },
  { name: { en: 'quadrilateral', zh: '四边形' }, sides: 4 },
  { name: { en: 'pentagon', zh: '五边形' }, sides: 5 },
  { name: { en: 'hexagon', zh: '六边形' }, sides: 6 },
  { name: { en: 'heptagon', zh: '七边形' }, sides: 7 },
  { name: { en: 'octagon', zh: '八边形' }, sides: 8 },
];

function countSidesQuestion(rng: Rng): Question {
  const shape = rng.pick(POLYGONS);
  const askVertices = rng.chance(0.5);

  return {
    id: `shp-count-${shape.name.en}-${askVertices ? 'v' : 's'}`,
    prompt: askVertices
      ? { en: `How many vertices (corners) does a ${shape.name.en} have?`, zh: `${shape.name.zh}有多少个顶点？` }
      : { en: `How many sides does a ${shape.name.en} have?`, zh: `${shape.name.zh}有多少条边？` },
    answer: String(shape.sides),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `A ${shape.name.en} has ${shape.sides} sides and ${shape.sides} vertices.`,
      zh: `${shape.name.zh}有 ${shape.sides} 条边和 ${shape.sides} 个顶点。`,
    },
  };
}

// Canonical (English) shape labels used for MCQ choices/answer — the button
// label itself is a fixed, locale-neutral token (like "RM" in money.ts),
// while the surrounding prompt sentence is fully bilingual.
const SHAPE_DESCRIPTIONS: { shape: string; en: string; zh: string }[] = [
  { shape: 'square', en: 'I have 4 equal sides and 4 right angles. What shape am I?', zh: '我有4条相等的边和4个直角。我是什么图形？' },
  { shape: 'rectangle', en: 'I have 4 sides, opposite sides are equal, and I have 4 right angles, but not all my sides are equal. What shape am I?', zh: '我有4条边，对边相等，也有4个直角，但不是所有边都相等。我是什么图形？' },
  { shape: 'triangle', en: 'I have 3 sides and 3 vertices. What shape am I?', zh: '我有3条边和3个顶点。我是什么图形？' },
  { shape: 'pentagon', en: 'I have 5 sides and 5 vertices. What shape am I?', zh: '我有5条边和5个顶点。我是什么图形？' },
  { shape: 'hexagon', en: 'I have 6 sides and 6 vertices. What shape am I?', zh: '我有6条边和6个顶点。我是什么图形？' },
];
const SHAPE_NAMES = ['square', 'rectangle', 'triangle', 'pentagon', 'hexagon'];

function identifyShapeQuestion(rng: Rng): Question {
  const item = rng.pick(SHAPE_DESCRIPTIONS);
  const others = SHAPE_NAMES.filter((s) => s !== item.shape);
  const distractors = rng.shuffle(others).slice(0, 3);
  const choices = rng.shuffle([item.shape, ...distractors]);

  return {
    id: `shp-identify-${item.shape}`,
    prompt: { en: item.en, zh: item.zh },
    choices,
    answer: item.shape,
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `The shape described is a ${item.shape}.`,
      zh: `描述的图形是${item.shape}。`,
    },
  };
}

function compositeLShapeQuestion(rng: Rng): Question {
  // An L-shape made by cutting a small rectangle out of a big rectangle's corner.
  const bigLength = rng.int(10, 30);
  const bigWidth = rng.int(10, 30);
  const cutLength = rng.int(2, bigLength - 3);
  const cutWidth = rng.int(2, bigWidth - 3);
  const askArea = rng.chance(0.5);

  const bigArea = bigLength * bigWidth;
  const cutArea = cutLength * cutWidth;
  const area = bigArea - cutArea;
  // Perimeter of an L-shape cut from a corner equals the perimeter of the
  // original rectangle (the cut removes/replaces equal amounts of edge).
  const perimeter = 2 * (bigLength + bigWidth);

  if (askArea) {
    const choices = buildChoices(rng, area, [
      () => bigArea,
      () => bigArea + cutArea,
      () => area + cutArea / 2,
      () => area - 5,
    ]);
    return {
      id: `shp-lshape-area-${bigLength}-${bigWidth}-${cutLength}-${cutWidth}`,
      prompt: {
        en: `A big rectangle ${bigLength} cm by ${bigWidth} cm has a small rectangle ${cutLength} cm by ${cutWidth} cm cut out of one corner, forming an L-shape. What is the area of the L-shape?`,
        zh: `一个 ${bigLength} 厘米 × ${bigWidth} 厘米的大长方形，从一个角切去一个 ${cutLength} 厘米 × ${cutWidth} 厘米的小长方形，形成一个L形。这个L形的面积是多少？`,
      },
      choices,
      answer: String(area),
      kind: 'mcq',
      topic: meta.id,
      explain: {
        en: `${bigLength} × ${bigWidth} - ${cutLength} × ${cutWidth} = ${bigArea} - ${cutArea} = ${area} cm²`,
        zh: `${bigLength} × ${bigWidth} - ${cutLength} × ${cutWidth} = ${bigArea} - ${cutArea} = ${area} 平方厘米`,
      },
    };
  }
  const choices = buildChoices(rng, perimeter, [
    () => perimeter + cutLength * 2,
    () => perimeter - cutWidth * 2,
    () => perimeter + 4,
    () => perimeter - 4,
  ]);
  return {
    id: `shp-lshape-perim-${bigLength}-${bigWidth}-${cutLength}-${cutWidth}`,
    prompt: {
      en: `A big rectangle ${bigLength} cm by ${bigWidth} cm has a small rectangle ${cutLength} cm by ${cutWidth} cm cut out of one corner, forming an L-shape. What is the perimeter of the L-shape?`,
      zh: `一个 ${bigLength} 厘米 × ${bigWidth} 厘米的大长方形，从一个角切去一个 ${cutLength} 厘米 × ${cutWidth} 厘米的小长方形，形成一个L形。这个L形的周长是多少？`,
    },
    choices,
    answer: String(perimeter),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `The L-shape's perimeter equals the original rectangle's perimeter: 2 × (${bigLength} + ${bigWidth}) = ${perimeter} cm.`,
      zh: `L形的周长等于原来长方形的周长：2 × (${bigLength} + ${bigWidth}) = ${perimeter} 厘米。`,
    },
  };
}

function cuboidVolumeQuestion(rng: Rng): Question {
  const isCube = rng.chance(0.3);
  if (isCube) {
    const side = rng.int(2, 15);
    const volume = side ** 3;
    return {
      id: `shp-cube-${side}`,
      prompt: {
        en: `A cube has sides of ${side} cm. What is its volume?`,
        zh: `一个立方体的边长是 ${side} 厘米。它的体积是多少？`,
      },
      answer: String(volume),
      kind: 'numeric',
      topic: meta.id,
      explain: { en: `Volume = ${side} × ${side} × ${side} = ${volume} cm³`, zh: `体积 = ${side} × ${side} × ${side} = ${volume} 立方厘米` },
    };
  }
  const length = rng.int(2, 20);
  const width = rng.int(2, 20);
  const height = rng.int(2, 20);
  const volume = length * width * height;
  return {
    id: `shp-cuboid-${length}-${width}-${height}`,
    prompt: {
      en: `A cuboid has length ${length} cm, width ${width} cm, and height ${height} cm. What is its volume?`,
      zh: `一个长方体的长是 ${length} 厘米，宽是 ${width} 厘米，高是 ${height} 厘米。它的体积是多少？`,
    },
    answer: String(volume),
    kind: 'numeric',
    topic: meta.id,
    explain: { en: `Volume = ${length} × ${width} × ${height} = ${volume} cm³`, zh: `体积 = ${length} × ${width} × ${height} = ${volume} 立方厘米` },
  };
}

export function generate(rng: Rng, difficulty: Difficulty): Question {
  if (difficulty === 'standard') {
    const kind = rng.pick(['rectperim', 'rectarea', 'square', 'count', 'identify'] as const);
    if (kind === 'rectperim') return rectanglePerimeterQuestion(rng, difficulty);
    if (kind === 'rectarea') return rectangleAreaQuestion(rng, difficulty);
    if (kind === 'square') return squareQuestion(rng, difficulty);
    if (kind === 'count') return countSidesQuestion(rng);
    return identifyShapeQuestion(rng);
  }
  const kind = rng.pick(['lshape', 'volume', 'rectperim', 'rectarea'] as const);
  if (kind === 'lshape') return compositeLShapeQuestion(rng);
  if (kind === 'volume') return cuboidVolumeQuestion(rng);
  if (kind === 'rectperim') return rectanglePerimeterQuestion(rng, difficulty);
  return rectangleAreaQuestion(rng, difficulty);
}
