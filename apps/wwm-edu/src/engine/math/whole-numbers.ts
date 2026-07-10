import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { formatNumber, numberToWordsEN, numberToWordsZH } from '../format';
import { buildChoices } from '../distractors';

export const meta: GeneratorMeta = {
  id: 'whole-numbers',
  name: { en: 'Whole Numbers', zh: '整数' },
  icon: '🔢',
};

type Place = 'ones' | 'tens' | 'hundreds' | 'thousands' | 'ten-thousands' | 'hundred-thousands';

const PLACE_INFO: Record<Place, { value: number; name: { en: string; zh: string } }> = {
  ones: { value: 1, name: { en: 'ones', zh: '个位' } },
  tens: { value: 10, name: { en: 'tens', zh: '十位' } },
  hundreds: { value: 100, name: { en: 'hundreds', zh: '百位' } },
  thousands: { value: 1000, name: { en: 'thousands', zh: '千位' } },
  'ten-thousands': { value: 10_000, name: { en: 'ten thousands', zh: '万位' } },
  'hundred-thousands': { value: 100_000, name: { en: 'hundred thousands', zh: '十万位' } },
};

function digitAtPlace(n: number, placeValue: number): number {
  return Math.floor(n / placeValue) % 10;
}

function randomNumber(rng: Rng, difficulty: Difficulty): number {
  return difficulty === 'standard' ? rng.int(1000, 99_999) : rng.int(50_000, 999_999);
}

function placeValueQuestion(rng: Rng, difficulty: Difficulty): Question {
  const n = randomNumber(rng, difficulty);
  const places: Place[] = difficulty === 'standard'
    ? ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands']
    : ['tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands'];
  const place = rng.pick(places);
  const { value, name } = PLACE_INFO[place];
  const correctDigit = digitAtPlace(n, value);
  const formatted = formatNumber(n);

  const others = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => d !== correctDigit);
  const distractorDigits = rng.shuffle(others).slice(0, 3);
  const choices = rng.shuffle([String(correctDigit), ...distractorDigits.map(String)]);

  return {
    id: `wn-place-${n}-${place}`,
    prompt: {
      en: `What is the digit in the ${name.en} place of ${formatted}?`,
      zh: `数字 ${formatted} 中，${name.zh}上的数字是多少？`,
    },
    choices,
    answer: String(correctDigit),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `In ${formatted}, the digit ${correctDigit} is in the ${name.en} place.`,
      zh: `在 ${formatted} 中，${name.zh}上的数字是 ${correctDigit}。`,
    },
  };
}

function roundQuestion(rng: Rng, difficulty: Difficulty): Question {
  const n = randomNumber(rng, difficulty);
  const roundTo = difficulty === 'standard'
    ? rng.pick([10, 100, 1000])
    : rng.pick([10, 100, 1000, 10_000, 100_000]);
  const rounded = Math.round(n / roundTo) * roundTo;
  const formatted = formatNumber(n);
  const correctStr = formatNumber(rounded);

  const candidates = [
    () => Math.floor(n / roundTo) * roundTo, // rounded down instead of nearest
    () => Math.ceil(n / roundTo) * roundTo, // rounded up instead of nearest
    () => rounded + roundTo,
    () => rounded - roundTo,
    () => Math.round(n / (roundTo * 10)) * (roundTo * 10), // wrong place value
  ];
  const choices = buildChoices(rng, rounded, candidates, formatNumber);

  return {
    id: `wn-round-${n}-${roundTo}`,
    prompt: {
      en: `Round ${formatted} to the nearest ${formatNumber(roundTo)}.`,
      zh: `把 ${formatted} 四舍五入到最接近的 ${formatNumber(roundTo)}。`,
    },
    choices,
    answer: correctStr,
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${formatted} rounded to the nearest ${formatNumber(roundTo)} is ${correctStr}.`,
      zh: `${formatted} 四舍五入到最接近的 ${formatNumber(roundTo)} 是 ${correctStr}。`,
    },
  };
}

function compareQuestion(rng: Rng, difficulty: Difficulty): Question {
  const count = 4;
  const nums = new Set<number>();
  while (nums.size < count) nums.add(randomNumber(rng, difficulty));
  const list = [...nums];
  const wantLargest = rng.chance(0.5);
  const correct = wantLargest ? Math.max(...list) : Math.min(...list);
  const choices = rng.shuffle(list.map(formatNumber));

  return {
    id: `wn-compare-${list.join('-')}`,
    prompt: {
      en: `Which number is the ${wantLargest ? 'largest' : 'smallest'}?`,
      zh: `哪一个数字最${wantLargest ? '大' : '小'}？`,
    },
    choices,
    answer: formatNumber(correct),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${formatNumber(correct)} is the ${wantLargest ? 'largest' : 'smallest'} of the given numbers.`,
      zh: `${formatNumber(correct)} 是给定数字中最${wantLargest ? '大' : '小'}的。`,
    },
  };
}

function numberWordsQuestion(rng: Rng, difficulty: Difficulty): Question {
  const n = randomNumber(rng, difficulty);
  const wordsEn = numberToWordsEN(n);
  const wordsZh = numberToWordsZH(n);

  return {
    id: `wn-words-${n}`,
    prompt: {
      en: `Write this number using digits: ${wordsEn}.`,
      zh: `请写出这个数字：${wordsZh}。`,
    },
    answer: String(n),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${wordsEn} = ${formatNumber(n)}`,
      zh: `${wordsZh} = ${formatNumber(n)}`,
    },
  };
}

export function generate(rng: Rng, difficulty: Difficulty): Question {
  const kind = rng.pick(['place', 'round', 'compare', 'words'] as const);
  switch (kind) {
    case 'place': return placeValueQuestion(rng, difficulty);
    case 'round': return roundQuestion(rng, difficulty);
    case 'compare': return compareQuestion(rng, difficulty);
    case 'words': return numberWordsQuestion(rng, difficulty);
  }
}
