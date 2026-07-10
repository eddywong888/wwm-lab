import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';

export const meta: GeneratorMeta = {
  id: 'decimals',
  name: { en: 'Decimals', zh: '小数' },
  icon: '🔟',
  term: 2,
};

/** Format an integer count of "units" (10^-dp) as a fixed-point decimal string. */
function formatDp(units: number, dp: number): string {
  const scale = 10 ** dp;
  const sign = units < 0 ? '-' : '';
  const abs = Math.abs(units);
  const whole = Math.floor(abs / scale);
  const frac = abs % scale;
  return dp === 0 ? `${sign}${whole}` : `${sign}${whole}.${String(frac).padStart(dp, '0')}`;
}

function randomUnits(rng: Rng, maxWhole: number, dp: number): number {
  const whole = rng.int(0, maxWhole);
  const frac = dp === 0 ? 0 : rng.int(0, 10 ** dp - 1);
  return whole * 10 ** dp + frac;
}

function placeValueQuestion(rng: Rng, difficulty: Difficulty): Question {
  const dp = difficulty === 'standard' ? 2 : 3;
  const whole = rng.int(0, 99);
  const fracDigits: number[] = [];
  for (let i = 0; i < dp; i++) fracDigits.push(rng.int(0, 9));
  const units = whole * 10 ** dp + fracDigits.reduce((acc, d, i) => acc + d * 10 ** (dp - 1 - i), 0);
  const decStr = formatDp(units, dp);

  const placeNames = [
    { en: 'tenths', zh: '十分位' },
    { en: 'hundredths', zh: '百分位' },
    { en: 'thousandths', zh: '千分位' },
  ];
  const placeIdx = rng.int(0, dp - 1);
  const correctDigit = fracDigits[placeIdx];
  const place = placeNames[placeIdx];

  const others = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => d !== correctDigit);
  const choices = rng.shuffle([String(correctDigit), ...rng.shuffle(others).slice(0, 3).map(String)]);

  return {
    id: `dec-place-${units}-${dp}-${placeIdx}`,
    prompt: {
      en: `What is the digit in the ${place.en} place of ${decStr}?`,
      zh: `数字 ${decStr} 中，${place.zh}上的数字是多少？`,
    },
    choices,
    answer: String(correctDigit),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `In ${decStr}, the digit ${correctDigit} is in the ${place.en} place.`,
      zh: `在 ${decStr} 中，${place.zh}上的数字是 ${correctDigit}。`,
    },
  };
}

function fractionToDecimalQuestion(rng: Rng): Question {
  const denom = rng.pick([10, 100] as const);
  const num = rng.int(1, denom - 1);
  const dp = denom === 10 ? 1 : 2;
  const decStr = formatDp(num, dp);

  return {
    id: `dec-fr2dec-${num}-${denom}`,
    prompt: {
      en: `Write ${num}/${denom} as a decimal.`,
      zh: `把 ${num}/${denom} 写成小数。`,
    },
    answer: decStr,
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${num}/${denom} = ${decStr}`,
      zh: `${num}/${denom} = ${decStr}`,
    },
  };
}

function decimalToFractionQuestion(rng: Rng): Question {
  const denom = rng.pick([10, 100] as const);
  const num = rng.int(1, denom - 1);
  const dp = denom === 10 ? 1 : 2;
  const decStr = formatDp(num, dp);
  const correct = `${num}/${denom}`;
  const otherDenom = denom === 10 ? 100 : 10;

  const candidates = [
    `${num + 1}/${denom}`,
    `${Math.max(num - 1, 1)}/${denom}`,
    `${num}/${otherDenom}`,
    `${num + 2}/${denom}`,
  ];
  const seen = new Set<string>([correct]);
  const distractors: string[] = [];
  for (const c of candidates) {
    if (distractors.length >= 3) break;
    if (!seen.has(c)) {
      seen.add(c);
      distractors.push(c);
    }
  }
  let jitter = 3;
  while (distractors.length < 3) {
    const candidate = `${num + jitter}/${denom}`;
    if (!seen.has(candidate)) {
      seen.add(candidate);
      distractors.push(candidate);
    }
    jitter++;
  }
  const choices = rng.shuffle([correct, ...distractors]);

  return {
    id: `dec-dec2fr-${num}-${denom}`,
    prompt: {
      en: `Write ${decStr} as a fraction.`,
      zh: `把 ${decStr} 写成分数。`,
    },
    choices,
    answer: correct,
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${decStr} = ${correct}`,
      zh: `${decStr} = ${correct}`,
    },
  };
}

function compareQuestion(rng: Rng, difficulty: Difficulty): Question {
  const dp = difficulty === 'standard' ? 2 : 3;
  const maxWhole = difficulty === 'standard' ? 50 : 200;
  const values = new Set<number>();
  while (values.size < 4) values.add(randomUnits(rng, maxWhole, dp));
  const list = [...values];
  const wantLargest = rng.chance(0.5);
  const correctUnits = wantLargest ? Math.max(...list) : Math.min(...list);
  const choices = rng.shuffle(list.map((u) => formatDp(u, dp)));

  return {
    id: `dec-compare-${list.join('-')}-${dp}`,
    prompt: {
      en: `Which decimal is the ${wantLargest ? 'largest' : 'smallest'}?`,
      zh: `哪一个小数最${wantLargest ? '大' : '小'}？`,
    },
    choices,
    answer: formatDp(correctUnits, dp),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${formatDp(correctUnits, dp)} is the ${wantLargest ? 'largest' : 'smallest'} of the given decimals.`,
      zh: `${formatDp(correctUnits, dp)} 是给定小数中最${wantLargest ? '大' : '小'}的。`,
    },
  };
}

function addSubQuestion(rng: Rng, difficulty: Difficulty): Question {
  const dp = difficulty === 'standard' ? 2 : 3;
  const maxWhole = difficulty === 'standard' ? 80 : 300;
  const a = randomUnits(rng, maxWhole, dp);
  const b = randomUnits(rng, maxWhole, dp);
  const isAdd = rng.chance(0.5);
  const bigger = Math.max(a, b);
  const smaller = Math.min(a, b);
  const result = isAdd ? a + b : bigger - smaller;

  return {
    id: `dec-addsub-${a}-${b}-${isAdd ? 'a' : 's'}-${dp}`,
    prompt: isAdd
      ? { en: `${formatDp(a, dp)} + ${formatDp(b, dp)} = ?`, zh: `${formatDp(a, dp)} + ${formatDp(b, dp)} = ?` }
      : { en: `${formatDp(bigger, dp)} - ${formatDp(smaller, dp)} = ?`, zh: `${formatDp(bigger, dp)} - ${formatDp(smaller, dp)} = ?` },
    answer: formatDp(result, dp),
    kind: 'numeric',
    topic: meta.id,
    explain: isAdd
      ? { en: `${formatDp(a, dp)} + ${formatDp(b, dp)} = ${formatDp(result, dp)}`, zh: `${formatDp(a, dp)} + ${formatDp(b, dp)} = ${formatDp(result, dp)}` }
      : { en: `${formatDp(bigger, dp)} - ${formatDp(smaller, dp)} = ${formatDp(result, dp)}`, zh: `${formatDp(bigger, dp)} - ${formatDp(smaller, dp)} = ${formatDp(result, dp)}` },
  };
}

function multiOperandAddQuestion(rng: Rng): Question {
  const dp = 3;
  const maxWhole = 100;
  const a = randomUnits(rng, maxWhole, dp);
  const b = randomUnits(rng, maxWhole, dp);
  const c = randomUnits(rng, maxWhole, dp);
  const total = a + b + c;

  return {
    id: `dec-multi-${a}-${b}-${c}`,
    prompt: {
      en: `${formatDp(a, dp)} + ${formatDp(b, dp)} + ${formatDp(c, dp)} = ?`,
      zh: `${formatDp(a, dp)} + ${formatDp(b, dp)} + ${formatDp(c, dp)} = ?`,
    },
    answer: formatDp(total, dp),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${formatDp(a, dp)} + ${formatDp(b, dp)} + ${formatDp(c, dp)} = ${formatDp(total, dp)}`,
      zh: `${formatDp(a, dp)} + ${formatDp(b, dp)} + ${formatDp(c, dp)} = ${formatDp(total, dp)}`,
    },
  };
}

function mulDivBy10100Question(rng: Rng): Question {
  const baseDp = rng.int(0, 2);
  const baseUnits = rng.int(1, 999);
  const baseValue = baseUnits / 10 ** baseDp;
  const op = rng.pick(['mul', 'div'] as const);
  const factor = op === 'div' && baseDp === 2 ? 10 : rng.pick([10, 100] as const);
  const factorExp = factor === 10 ? 1 : 2;

  const resultDp = op === 'mul' ? Math.max(baseDp - factorExp, 0) : baseDp + factorExp;
  const resultValue = op === 'mul' ? baseValue * factor : baseValue / factor;
  const correctStr = resultValue.toFixed(resultDp);

  return {
    id: `dec-muldiv-${baseUnits}-${baseDp}-${op}-${factor}`,
    prompt: {
      en: `${baseValue.toFixed(baseDp)} ${op === 'mul' ? '×' : '÷'} ${factor} = ?`,
      zh: `${baseValue.toFixed(baseDp)} ${op === 'mul' ? '×' : '÷'} ${factor} = ?`,
    },
    answer: correctStr,
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${baseValue.toFixed(baseDp)} ${op === 'mul' ? '×' : '÷'} ${factor} = ${correctStr}`,
      zh: `${baseValue.toFixed(baseDp)} ${op === 'mul' ? '×' : '÷'} ${factor} = ${correctStr}`,
    },
  };
}

export function generate(rng: Rng, difficulty: Difficulty): Question {
  if (difficulty === 'standard') {
    const kind = rng.pick(['place', 'fr2dec', 'dec2fr', 'compare', 'addsub'] as const);
    if (kind === 'place') return placeValueQuestion(rng, difficulty);
    if (kind === 'fr2dec') return fractionToDecimalQuestion(rng);
    if (kind === 'dec2fr') return decimalToFractionQuestion(rng);
    if (kind === 'compare') return compareQuestion(rng, difficulty);
    return addSubQuestion(rng, difficulty);
  }
  const kind = rng.pick(['muldiv', 'multi', 'addsub', 'place', 'compare'] as const);
  if (kind === 'muldiv') return mulDivBy10100Question(rng);
  if (kind === 'multi') return multiOperandAddQuestion(rng);
  if (kind === 'addsub') return addSubQuestion(rng, difficulty);
  if (kind === 'place') return placeValueQuestion(rng, difficulty);
  return compareQuestion(rng, difficulty);
}
