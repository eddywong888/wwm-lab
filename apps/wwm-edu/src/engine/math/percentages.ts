import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { buildChoices } from '../distractors';

export const meta: GeneratorMeta = {
  id: 'percentages',
  name: { en: 'Percentages', zh: '百分比' },
  icon: '💯',
  term: 2,
};

function fractionToPercentQuestion(rng: Rng): Question {
  const num = rng.int(1, 99);
  return {
    id: `pct-fr2pct-${num}`,
    prompt: {
      en: `${num}/100 = ?%`,
      zh: `${num}/100 = ?%`,
    },
    answer: String(num),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${num}/100 = ${num}%`,
      zh: `${num}/100 = ${num}%`,
    },
  };
}

function percentToFractionQuestion(rng: Rng): Question {
  const percent = rng.int(1, 99);
  const correct = `${percent}/100`;

  const candidates = [
    `${100 - percent}/100`,
    `${Math.max(percent - 1, 0)}/100`,
    `${percent}/10`,
    `${percent + 1}/100`,
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
  let jitter = 2;
  while (distractors.length < 3) {
    const candidate = `${percent + jitter}/100`;
    if (!seen.has(candidate)) {
      seen.add(candidate);
      distractors.push(candidate);
    }
    jitter++;
  }
  const choices = rng.shuffle([correct, ...distractors]);

  return {
    id: `pct-pct2fr-${percent}`,
    prompt: {
      en: `${percent}% = ?/100`,
      zh: `${percent}% = ?/100`,
    },
    choices,
    answer: correct,
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${percent}% = ${correct}`,
      zh: `${percent}% = ${correct}`,
    },
  };
}

function decimalToPercentQuestion(rng: Rng): Question {
  const hundredths = rng.int(1, 99);
  const decStr = `0.${String(hundredths).padStart(2, '0')}`;
  return {
    id: `pct-dec2pct-${hundredths}`,
    prompt: {
      en: `${decStr} = ?%`,
      zh: `${decStr} = ?%`,
    },
    answer: String(hundredths),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${decStr} = ${hundredths}%`,
      zh: `${decStr} = ${hundredths}%`,
    },
  };
}

function percentToDecimalQuestion(rng: Rng): Question {
  const percent = rng.int(1, 99);
  const decStr = `0.${String(percent).padStart(2, '0')}`;

  return {
    id: `pct-pct2dec-${percent}`,
    prompt: {
      en: `${percent}% = ?`,
      zh: `${percent}% = ?`,
    },
    answer: decStr,
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${percent}% = ${decStr}`,
      zh: `${percent}% = ${decStr}`,
    },
  };
}

function percentOf100Question(rng: Rng): Question {
  const percent = rng.int(1, 99);
  return {
    id: `pct-of100-${percent}`,
    prompt: {
      en: `${percent}% of 100 = ?`,
      zh: `100 的 ${percent}% 是多少？`,
    },
    answer: String(percent),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${percent}% of 100 = ${percent}`,
      zh: `100 的 ${percent}% = ${percent}`,
    },
  };
}

const NICE_PERCENTS = [10, 20, 25, 50, 75];

function percentOfQuantityQuestion(rng: Rng): Question {
  const percent = rng.pick(NICE_PERCENTS);
  const quantity = rng.int(1, 50) * 20; // multiple of 20: divisible by 10, 20, 25, 50, 75%
  const result = (quantity * percent) / 100;

  const choices = buildChoices(rng, result, [
    () => result + quantity / 20,
    () => Math.max(result - quantity / 20, 1),
    () => quantity - result,
    () => (quantity * (percent + 10)) / 100,
  ]);

  return {
    id: `pct-ofqty-${percent}-${quantity}`,
    prompt: {
      en: `${percent}% of ${quantity} = ?`,
      zh: `${quantity} 的 ${percent}% 是多少？`,
    },
    choices,
    answer: String(result),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${percent}% of ${quantity} = (${percent}/100) × ${quantity} = ${result}`,
      zh: `${quantity} 的 ${percent}% = (${percent}/100) × ${quantity} = ${result}`,
    },
  };
}

const NICE_DENOMS = [2, 4, 5, 10, 20, 25, 50];

function fractionToPercentNiceQuestion(rng: Rng): Question {
  const den = rng.pick(NICE_DENOMS);
  const num = rng.int(1, den - 1);
  const factor = 100 / den;
  const percent = num * factor;

  return {
    id: `pct-frnice-${num}-${den}`,
    prompt: {
      en: `Write ${num}/${den} as a percentage.`,
      zh: `把 ${num}/${den} 写成百分比。`,
    },
    answer: String(percent),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${num}/${den} = ${num} × ${factor}/100 = ${percent}%`,
      zh: `${num}/${den} = ${num} × ${factor}/100 = ${percent}%`,
    },
  };
}

export function generate(rng: Rng, difficulty: Difficulty): Question {
  if (difficulty === 'standard') {
    const kind = rng.pick(['fr2pct', 'pct2fr', 'dec2pct', 'pct2dec', 'of100'] as const);
    if (kind === 'fr2pct') return fractionToPercentQuestion(rng);
    if (kind === 'pct2fr') return percentToFractionQuestion(rng);
    if (kind === 'dec2pct') return decimalToPercentQuestion(rng);
    if (kind === 'pct2dec') return percentToDecimalQuestion(rng);
    return percentOf100Question(rng);
  }
  const kind = rng.pick(['ofqty', 'frnice', 'fr2pct', 'dec2pct'] as const);
  if (kind === 'ofqty') return percentOfQuantityQuestion(rng);
  if (kind === 'frnice') return fractionToPercentNiceQuestion(rng);
  if (kind === 'fr2pct') return fractionToPercentQuestion(rng);
  return decimalToPercentQuestion(rng);
}
