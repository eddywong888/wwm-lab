import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { buildChoices } from '../distractors';

export const meta: GeneratorMeta = {
  id: 'fractions',
  name: { en: 'Fractions', zh: '分数' },
  icon: '🍕',
  term: 2,
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function fracStr(num: number, den: number): string {
  return `${num}/${den}`;
}

/** Build a small set of unique, plausible fraction-string MCQ choices. */
function fractionChoices(rng: Rng, correct: string, candidates: string[]): string[] {
  const seen = new Set<string>([correct]);
  const distractors: string[] = [];
  for (const c of candidates) {
    if (distractors.length >= 3) break;
    if (!seen.has(c)) {
      seen.add(c);
      distractors.push(c);
    }
  }
  let jitterNum = 1;
  let jitterDen = 2;
  while (distractors.length < 3) {
    const candidate = fracStr(jitterNum, jitterDen);
    if (!seen.has(candidate)) {
      seen.add(candidate);
      distractors.push(candidate);
    }
    jitterNum++;
    jitterDen++;
  }
  return rng.shuffle([correct, ...distractors]);
}

function equivalentFractionQuestion(rng: Rng, difficulty: Difficulty): Question {
  const b = rng.int(2, 10);
  const a = rng.int(1, b - 1);
  const k = difficulty === 'standard' ? rng.int(2, 4) : rng.int(2, 6);
  const d = b * k;
  const correctNum = a * k;

  const choices = buildChoices(rng, correctNum, [
    () => correctNum + 1,
    () => correctNum - 1,
    () => a * (k + 1),
    () => a + k,
    () => d - correctNum,
  ], String);

  return {
    id: `fr-equiv-${a}-${b}-${d}`,
    prompt: {
      en: `${fracStr(a, b)} = ?/${d}. What is the missing numerator?`,
      zh: `${fracStr(a, b)} = ?/${d}。缺少的分子是多少？`,
    },
    choices,
    answer: String(correctNum),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${fracStr(a, b)} = ${fracStr(correctNum, d)} because ${b} × ${k} = ${d}, so ${a} × ${k} = ${correctNum}.`,
      zh: `${fracStr(a, b)} = ${fracStr(correctNum, d)}，因为 ${b} × ${k} = ${d}，所以 ${a} × ${k} = ${correctNum}。`,
    },
  };
}

function randomProperFraction(rng: Rng, maxDen: number): { num: number; den: number } {
  const den = rng.int(2, maxDen);
  const num = rng.int(1, den - 1);
  return { num, den };
}

function compareFractionQuestion(rng: Rng, difficulty: Difficulty): Question {
  const maxDen = difficulty === 'standard' ? 10 : 12;
  const fracs: { num: number; den: number }[] = [];
  const seenVals = new Set<number>();
  let guard = 0;
  while (fracs.length < 4 && guard < 200) {
    guard++;
    const f = randomProperFraction(rng, maxDen);
    const key = Math.round((f.num / f.den) * 100000);
    if (!seenVals.has(key)) {
      seenVals.add(key);
      fracs.push(f);
    }
  }
  while (fracs.length < 4) fracs.push({ num: 1, den: fracs.length + 2 });

  const wantLargest = rng.chance(0.5);
  const sorted = [...fracs].sort((x, y) => x.num / x.den - y.num / y.den);
  const target = wantLargest ? sorted[sorted.length - 1] : sorted[0];
  const choices = rng.shuffle(fracs.map((f) => fracStr(f.num, f.den)));

  return {
    id: `fr-compare-${fracs.map((f) => `${f.num}-${f.den}`).join('_')}`,
    prompt: {
      en: `Which fraction is the ${wantLargest ? 'largest' : 'smallest'}?`,
      zh: `哪一个分数最${wantLargest ? '大' : '小'}？`,
    },
    choices,
    answer: fracStr(target.num, target.den),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${fracStr(target.num, target.den)} = ${(target.num / target.den).toFixed(3)}, the ${wantLargest ? 'largest' : 'smallest'} value.`,
      zh: `${fracStr(target.num, target.den)} = ${(target.num / target.den).toFixed(3)}，是最${wantLargest ? '大' : '小'}的分数。`,
    },
  };
}

function addSubSameDenomQuestion(rng: Rng, difficulty: Difficulty): Question {
  const maxDen = difficulty === 'standard' ? 10 : 12;
  const den = rng.int(3, maxDen);
  const isAdd = rng.chance(0.5);

  if (isAdd) {
    const num1 = rng.int(1, den - 2);
    const num2 = rng.int(1, den - num1 - 1);
    const sum = num1 + num2;
    const correct = fracStr(sum, den);
    const choices = fractionChoices(rng, correct, [
      fracStr(sum + 1, den),
      fracStr(Math.max(sum - 1, 1), den),
      fracStr(num1 * num2, den),
      fracStr(den - sum, den),
    ]);
    return {
      id: `fr-add-${num1}-${num2}-${den}`,
      prompt: {
        en: `${fracStr(num1, den)} + ${fracStr(num2, den)} = ?`,
        zh: `${fracStr(num1, den)} + ${fracStr(num2, den)} = ?`,
      },
      choices,
      answer: correct,
      kind: 'mcq',
      topic: meta.id,
      explain: {
        en: `${fracStr(num1, den)} + ${fracStr(num2, den)} = ${correct} (add numerators, keep the denominator).`,
        zh: `${fracStr(num1, den)} + ${fracStr(num2, den)} = ${correct}（分子相加，分母不变）。`,
      },
    };
  }

  const num1 = rng.int(2, den - 1);
  const num2 = rng.int(1, num1 - 1);
  const diff = num1 - num2;
  const correct = fracStr(diff, den);
  const choices = fractionChoices(rng, correct, [
    fracStr(diff + 1, den),
    fracStr(Math.max(diff - 1, 1), den),
    fracStr(num1 + num2, den),
    fracStr(den - diff, den),
  ]);
  return {
    id: `fr-sub-${num1}-${num2}-${den}`,
    prompt: {
      en: `${fracStr(num1, den)} - ${fracStr(num2, den)} = ?`,
      zh: `${fracStr(num1, den)} - ${fracStr(num2, den)} = ?`,
    },
    choices,
    answer: correct,
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${fracStr(num1, den)} - ${fracStr(num2, den)} = ${correct} (subtract numerators, keep the denominator).`,
      zh: `${fracStr(num1, den)} - ${fracStr(num2, den)} = ${correct}（分子相减，分母不变）。`,
    },
  };
}

function fractionOfQuantityQuestion(rng: Rng, difficulty: Difficulty): Question {
  const den = rng.int(2, 10);
  const num = rng.int(1, den - 1);
  const multiplier = difficulty === 'standard' ? rng.int(2, 12) : rng.int(10, 40);
  const quantity = den * multiplier;
  const result = num * multiplier;

  return {
    id: `fr-of-${num}-${den}-${quantity}`,
    prompt: {
      en: `What is ${fracStr(num, den)} of ${quantity}?`,
      zh: `${quantity} 的 ${fracStr(num, den)} 是多少？`,
    },
    answer: String(result),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${quantity} ÷ ${den} = ${multiplier}, then ${multiplier} × ${num} = ${result}.`,
      zh: `${quantity} ÷ ${den} = ${multiplier}，再 ${multiplier} × ${num} = ${result}。`,
    },
  };
}

function simplestFormQuestion(rng: Rng): Question {
  let baseDen = rng.int(2, 6);
  let baseNum = rng.int(1, baseDen - 1);
  while (gcd(baseNum, baseDen) !== 1) {
    baseDen = rng.int(2, 6);
    baseNum = rng.int(1, baseDen - 1);
  }
  const f = rng.int(2, 4);
  const num = baseNum * f;
  const den = baseDen * f;
  const correct = fracStr(baseNum, baseDen);

  const choices = fractionChoices(rng, correct, [
    fracStr(num, baseDen),
    fracStr(baseNum, den),
    fracStr(baseNum + 1, baseDen),
    fracStr(baseNum, baseDen + 1),
  ]);

  return {
    id: `fr-simplest-${num}-${den}`,
    prompt: {
      en: `Write ${fracStr(num, den)} in its simplest form.`,
      zh: `把 ${fracStr(num, den)} 化简为最简分数。`,
    },
    choices,
    answer: correct,
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${fracStr(num, den)} ÷ ${f}/${f} = ${correct}.`,
      zh: `${fracStr(num, den)} 除以 ${f}/${f} 等于 ${correct}。`,
    },
  };
}

function addSubDifferentDenomQuestion(rng: Rng): Question {
  const denA = rng.int(2, 4);
  const k = rng.int(2, 3);
  const denB = denA * k;
  const numA = rng.int(1, denA - 1);
  const convertedA = numA * k;
  const isAdd = rng.chance(0.5);

  if (isAdd) {
    const maxNumB = Math.max(1, denB - 1 - convertedA);
    const numB = rng.int(1, maxNumB);
    const sum = convertedA + numB;
    const correct = fracStr(sum, denB);
    const choices = fractionChoices(rng, correct, [
      fracStr(sum + 1, denB),
      fracStr(Math.max(sum - 1, 1), denB),
      fracStr(numA + numB, denB),
      fracStr(sum, denB + 1),
    ]);
    return {
      id: `fr-adddiff-${numA}-${denA}-${numB}-${denB}`,
      prompt: {
        en: `${fracStr(numA, denA)} + ${fracStr(numB, denB)} = ?`,
        zh: `${fracStr(numA, denA)} + ${fracStr(numB, denB)} = ?`,
      },
      choices,
      answer: correct,
      kind: 'mcq',
      topic: meta.id,
      explain: {
        en: `${fracStr(numA, denA)} = ${fracStr(convertedA, denB)}, so ${fracStr(convertedA, denB)} + ${fracStr(numB, denB)} = ${correct}.`,
        zh: `${fracStr(numA, denA)} = ${fracStr(convertedA, denB)}，所以 ${fracStr(convertedA, denB)} + ${fracStr(numB, denB)} = ${correct}。`,
      },
    };
  }

  let numB = rng.int(1, denB - 1);
  if (numB === convertedA) numB = numB === 1 ? numB + 1 : numB - 1;
  const bigger = Math.max(convertedA, numB);
  const smaller = Math.min(convertedA, numB);
  const diff = bigger - smaller;
  const correct = fracStr(diff, denB);
  const choices = fractionChoices(rng, correct, [
    fracStr(diff + 1, denB),
    fracStr(Math.max(diff - 1, 1), denB),
    fracStr(bigger + smaller, denB),
    fracStr(diff, denB + 1),
  ]);
  return {
    id: `fr-subdiff-${numA}-${denA}-${numB}-${denB}`,
    prompt: {
      en: `${fracStr(bigger, denB)} - ${fracStr(smaller, denB)} = ? (start from ${fracStr(numA, denA)} and ${fracStr(numB, denB)} converted to a common denominator)`,
      zh: `把 ${fracStr(numA, denA)} 和 ${fracStr(numB, denB)} 换成相同分母后：${fracStr(bigger, denB)} - ${fracStr(smaller, denB)} = ?`,
    },
    choices,
    answer: correct,
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${fracStr(bigger, denB)} - ${fracStr(smaller, denB)} = ${correct}.`,
      zh: `${fracStr(bigger, denB)} - ${fracStr(smaller, denB)} = ${correct}。`,
    },
  };
}

function formatMixed(whole: number, num: number, den: number): string {
  if (num === 0) return `${whole}`;
  if (whole === 0) return fracStr(num, den);
  return `${whole} ${fracStr(num, den)}`;
}

function mixedNumberQuestion(rng: Rng): Question {
  const den = rng.int(2, 8);
  const whole1 = rng.int(1, 5);
  const num1 = rng.int(1, den - 1);
  const whole2 = rng.int(1, 5);
  const num2 = rng.int(1, den - 1);
  const isAdd = rng.chance(0.5);

  if (isAdd) {
    const fracSum = num1 + num2;
    const extraWhole = Math.floor(fracSum / den);
    const fracRemainder = fracSum % den;
    const totalWhole = whole1 + whole2 + extraWhole;
    const correct = formatMixed(totalWhole, fracRemainder, den);
    const choices = fractionChoices(rng, correct, [
      formatMixed(totalWhole + 1, fracRemainder, den),
      formatMixed(Math.max(totalWhole - 1, 0), fracRemainder, den),
      formatMixed(whole1 + whole2, fracSum, den),
      formatMixed(totalWhole, Math.min(fracRemainder + 1, den - 1), den),
    ]);
    return {
      id: `fr-mixed-add-${whole1}-${num1}-${whole2}-${num2}-${den}`,
      prompt: {
        en: `${formatMixed(whole1, num1, den)} + ${formatMixed(whole2, num2, den)} = ?`,
        zh: `${formatMixed(whole1, num1, den)} + ${formatMixed(whole2, num2, den)} = ?`,
      },
      choices,
      answer: correct,
      kind: 'mcq',
      topic: meta.id,
      explain: {
        en: `Add whole numbers and fractions separately, then simplify: ${correct}.`,
        zh: `分别把整数和分数相加，再化简：${correct}。`,
      },
    };
  }

  let total1 = whole1 * den + num1;
  const total2 = whole2 * den + num2;
  if (total1 === total2) total1 += rng.int(1, den); // avoid a zero difference
  const bigTotal = Math.max(total1, total2);
  const smallTotal = Math.min(total1, total2);
  const diffTotal = bigTotal - smallTotal;
  const diffWhole = Math.floor(diffTotal / den);
  const diffFrac = diffTotal % den;
  const correct = formatMixed(diffWhole, diffFrac, den);
  const bigWhole = Math.floor(bigTotal / den);
  const bigFrac = bigTotal % den;
  const smallWhole = Math.floor(smallTotal / den);
  const smallFrac = smallTotal % den;

  const choices = fractionChoices(rng, correct, [
    formatMixed(diffWhole + 1, diffFrac, den),
    formatMixed(Math.max(diffWhole - 1, 0), diffFrac, den),
    formatMixed(diffWhole, Math.min(diffFrac + 1, den - 1), den),
    formatMixed(bigWhole - smallWhole, den - 1, den),
  ]);

  return {
    id: `fr-mixed-sub-${bigWhole}-${bigFrac}-${smallWhole}-${smallFrac}-${den}`,
    prompt: {
      en: `${formatMixed(bigWhole, bigFrac, den)} - ${formatMixed(smallWhole, smallFrac, den)} = ?`,
      zh: `${formatMixed(bigWhole, bigFrac, den)} - ${formatMixed(smallWhole, smallFrac, den)} = ?`,
    },
    choices,
    answer: correct,
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `Subtract whole numbers and fractions separately, regrouping if needed: ${correct}.`,
      zh: `分别把整数和分数相减，必要时借位：${correct}。`,
    },
  };
}

export function generate(rng: Rng, difficulty: Difficulty): Question {
  if (difficulty === 'standard') {
    const kind = rng.pick(['equiv', 'compare', 'addsub', 'of', 'simplest'] as const);
    if (kind === 'equiv') return equivalentFractionQuestion(rng, difficulty);
    if (kind === 'compare') return compareFractionQuestion(rng, difficulty);
    if (kind === 'addsub') return addSubSameDenomQuestion(rng, difficulty);
    if (kind === 'of') return fractionOfQuantityQuestion(rng, difficulty);
    return simplestFormQuestion(rng);
  }
  const kind = rng.pick(['adddiff', 'mixed', 'of', 'compare', 'simplest'] as const);
  if (kind === 'adddiff') return addSubDifferentDenomQuestion(rng);
  if (kind === 'mixed') return mixedNumberQuestion(rng);
  if (kind === 'of') return fractionOfQuantityQuestion(rng, difficulty);
  if (kind === 'compare') return compareFractionQuestion(rng, difficulty);
  return simplestFormQuestion(rng);
}
