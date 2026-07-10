import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { formatNumber } from '../format';
import { buildChoices } from '../distractors';

export const meta: GeneratorMeta = {
  id: 'mul-div',
  name: { en: 'Multiplication & Division', zh: '乘法与除法' },
  icon: '✖️',
  term: 1,
};

function multiplyQuestion(rng: Rng, difficulty: Difficulty): Question {
  // up to 3-digit x 2-digit (standard); advanced allows the top of that range
  const a = difficulty === 'standard' ? rng.int(12, 400) : rng.int(100, 999);
  const b = difficulty === 'standard' ? rng.int(2, 50) : rng.int(11, 99);
  const product = a * b;
  const choices = buildChoices(rng, product, [
    () => a * (b + 1),
    () => a * (b - 1),
    () => (a + 1) * b,
    () => product + rng.int(1, 20) * rng.pick([1, -1]),
    () => a + b * 10, // digit-shift style error
  ], formatNumber);

  return {
    id: `md-mul-${a}-${b}`,
    prompt: {
      en: `${formatNumber(a)} × ${formatNumber(b)} = ?`,
      zh: `${formatNumber(a)} × ${formatNumber(b)} = ?`,
    },
    choices,
    answer: formatNumber(product),
    kind: 'mcq',
    topic: meta.id,
    explain: { en: `${formatNumber(a)} × ${formatNumber(b)} = ${formatNumber(product)}`, zh: `${formatNumber(a)} × ${formatNumber(b)} = ${formatNumber(product)}` },
  };
}

function divideQuestion(rng: Rng, difficulty: Difficulty): Question {
  const divisor = difficulty === 'standard' ? rng.pick([2, 3, 4, 5, 6, 7, 8, 9]) : rng.pick([10, 100]);
  const wantRemainder = rng.chance(0.4);
  const quotient = difficulty === 'standard' ? rng.int(11, 999) : rng.int(11, 9999);
  const remainder = wantRemainder ? rng.int(1, divisor - 1) : 0;
  const dividend = quotient * divisor + remainder;
  if (divisor < 10 && dividend > 9999) {
    // keep within "up to 4-digit ÷ 1-digit" bound; regenerate smaller quotient
    const smallerQuotient = Math.floor(9999 / divisor / 2) || 1;
    const dv = smallerQuotient * divisor + remainder;
    return buildDivideQuestion(rng, dv, divisor, smallerQuotient, remainder);
  }
  return buildDivideQuestion(rng, dividend, divisor, quotient, remainder);
}

function buildDivideQuestion(rng: Rng, dividend: number, divisor: number, quotient: number, remainder: number): Question {
  const askRemainder = remainder > 0 && rng.chance(0.5);
  const correct = askRemainder ? remainder : quotient;

  const candidates = askRemainder
    ? [
        () => (remainder + 1) % divisor,
        () => Math.max(0, remainder - 1),
        () => quotient % 10,
        () => remainder + divisor,
      ]
    : [
        () => quotient + 1,
        () => quotient - 1,
        () => Math.floor(dividend / (divisor + 1)),
        () => quotient + 10,
      ];
  const choices = buildChoices(rng, correct, candidates, formatNumber);

  const remainderNote = remainder > 0
    ? { en: ` remainder ${remainder}`, zh: `……余 ${remainder}` }
    : { en: '', zh: '' };

  return {
    id: `md-div-${dividend}-${divisor}-${askRemainder ? 'r' : 'q'}`,
    prompt: askRemainder
      ? {
          en: `${formatNumber(dividend)} ÷ ${divisor} = ${formatNumber(quotient)} remainder ?`,
          zh: `${formatNumber(dividend)} ÷ ${divisor} = ${formatNumber(quotient)} ……余多少？`,
        }
      : {
          en: `${formatNumber(dividend)} ÷ ${divisor} = ?`,
          zh: `${formatNumber(dividend)} ÷ ${divisor} = ?`,
        },
    choices,
    answer: formatNumber(correct),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${formatNumber(dividend)} ÷ ${divisor} = ${formatNumber(quotient)}${remainderNote.en}`,
      zh: `${formatNumber(dividend)} ÷ ${divisor} = ${formatNumber(quotient)}${remainderNote.zh}`,
    },
  };
}

function twoStepWordProblem(rng: Rng): Question {
  // e.g. buy `qty` boxes of `perBox` items each, then split among `groups`
  const perBox = rng.int(6, 24);
  const qty = rng.int(5, 40);
  const total = perBox * qty;
  const groups = rng.pick([2, 3, 4, 5, 6]);
  // ensure clean division for the second step
  const adjTotal = total - (total % groups);
  const perGroup = adjTotal / groups;

  return {
    id: `md-2step-${perBox}-${qty}-${groups}`,
    prompt: {
      en: `A shop packs ${formatNumber(qty)} boxes with ${formatNumber(perBox)} pencils in each box. If the pencils are shared equally among ${groups} classes, how many pencils does each class get? (Use ${formatNumber(adjTotal)} pencils in total.)`,
      zh: `一间商店把 ${formatNumber(qty)} 盒铅笔打包，每盒有 ${formatNumber(perBox)} 支。如果把铅笔平分给 ${groups} 个班级，每班能得到多少支？（总共使用 ${formatNumber(adjTotal)} 支铅笔。）`,
    },
    answer: String(perGroup),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${formatNumber(adjTotal)} ÷ ${groups} = ${formatNumber(perGroup)}`,
      zh: `${formatNumber(adjTotal)} ÷ ${groups} = ${formatNumber(perGroup)}`,
    },
  };
}

export function generate(rng: Rng, difficulty: Difficulty): Question {
  if (difficulty === 'standard') {
    const kind = rng.pick(['mul', 'div'] as const);
    return kind === 'mul' ? multiplyQuestion(rng, difficulty) : divideQuestion(rng, difficulty);
  }
  const kind = rng.pick(['mul', 'div', 'word'] as const);
  if (kind === 'mul') return multiplyQuestion(rng, difficulty);
  if (kind === 'div') return divideQuestion(rng, difficulty);
  return twoStepWordProblem(rng);
}
