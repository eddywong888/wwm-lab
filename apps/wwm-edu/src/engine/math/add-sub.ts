import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { formatNumber } from '../format';
import { buildChoices, forgotCarry, transposeDigits, wrongPlaceValue } from '../distractors';

export const meta: GeneratorMeta = {
  id: 'add-sub',
  name: { en: 'Addition & Subtraction', zh: '加法与减法' },
  icon: '➕',
};

const NAMES: { en: string; zh: string }[] = [
  { en: 'Ali', zh: '阿里' },
  { en: 'Mei Ling', zh: '美玲' },
  { en: 'Kumar', zh: '古马' },
  { en: 'Siti', zh: '茜蒂' },
  { en: 'Wei Jian', zh: '伟健' },
  { en: 'Farah', zh: '法拉' },
];

const ITEMS: { en: string; zh: string }[] = [
  { en: 'stickers', zh: '贴纸' },
  { en: 'marbles', zh: '弹珠' },
  { en: 'storybooks', zh: '故事书' },
  { en: 'eggs', zh: '鸡蛋' },
  { en: 'pencils', zh: '铅笔' },
];

function plainAdd(rng: Rng, difficulty: Difficulty): Question {
  const max = difficulty === 'standard' ? 60_000 : 500_000;
  const a = rng.int(100, max);
  const b = rng.int(100, max);
  const sum = a + b;
  const choices = buildChoices(rng, sum, [
    () => forgotCarry(a, b),
    () => transposeDigits(sum, rng),
    () => wrongPlaceValue(sum, rng),
    () => sum + rng.int(1, 9),
  ], formatNumber);

  return {
    id: `as-add-${a}-${b}`,
    prompt: {
      en: `${formatNumber(a)} + ${formatNumber(b)} = ?`,
      zh: `${formatNumber(a)} + ${formatNumber(b)} = ?`,
    },
    choices,
    answer: formatNumber(sum),
    kind: 'mcq',
    topic: meta.id,
    explain: { en: `${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(sum)}`, zh: `${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(sum)}` },
  };
}

function plainSub(rng: Rng, difficulty: Difficulty): Question {
  const max = difficulty === 'standard' ? 60_000 : 500_000;
  const a = rng.int(1000, max);
  const b = rng.int(100, a - 1);
  const diff = a - b;
  const choices = buildChoices(rng, diff, [
    () => transposeDigits(diff, rng),
    () => wrongPlaceValue(diff, rng),
    () => diff + rng.int(1, 9),
    () => b - a < 0 ? Math.abs(a - b - 10) : diff + 10,
  ], formatNumber);

  return {
    id: `as-sub-${a}-${b}`,
    prompt: {
      en: `${formatNumber(a)} - ${formatNumber(b)} = ?`,
      zh: `${formatNumber(a)} - ${formatNumber(b)} = ?`,
    },
    choices,
    answer: formatNumber(diff),
    kind: 'mcq',
    topic: meta.id,
    explain: { en: `${formatNumber(a)} - ${formatNumber(b)} = ${formatNumber(diff)}`, zh: `${formatNumber(a)} - ${formatNumber(b)} = ${formatNumber(diff)}` },
  };
}

function wordProblem(rng: Rng, difficulty: Difficulty): Question {
  const max = difficulty === 'standard' ? 40_000 : 300_000;
  const name = rng.pick(NAMES);
  const item = rng.pick(ITEMS);
  const isAdd = rng.chance(0.5);
  const a = rng.int(100, max);
  const b = rng.int(100, max);

  if (isAdd) {
    const total = a + b;
    return {
      id: `as-word-add-${a}-${b}`,
      prompt: {
        en: `${name.en} has ${formatNumber(a)} ${item.en}. ${name.en} gets ${formatNumber(b)} more ${item.en}. How many ${item.en} does ${name.en} have now?`,
        zh: `${name.zh}有 ${formatNumber(a)} 个${item.zh}。${name.zh}又得到 ${formatNumber(b)} 个${item.zh}。${name.zh}现在一共有多少个${item.zh}？`,
      },
      answer: String(total),
      kind: 'numeric',
      topic: meta.id,
      explain: { en: `${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(total)}`, zh: `${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(total)}` },
    };
  }
  const bigger = Math.max(a, b);
  const smaller = Math.min(a, b);
  const remaining = bigger - smaller;
  return {
    id: `as-word-sub-${a}-${b}`,
    prompt: {
      en: `${name.en} has ${formatNumber(bigger)} ${item.en}. ${name.en} gives away ${formatNumber(smaller)} ${item.en}. How many ${item.en} does ${name.en} have left?`,
      zh: `${name.zh}有 ${formatNumber(bigger)} 个${item.zh}。${name.zh}送出了 ${formatNumber(smaller)} 个${item.zh}。${name.zh}还剩下多少个${item.zh}？`,
    },
    answer: String(remaining),
    kind: 'numeric',
    topic: meta.id,
    explain: { en: `${formatNumber(bigger)} - ${formatNumber(smaller)} = ${formatNumber(remaining)}`, zh: `${formatNumber(bigger)} - ${formatNumber(smaller)} = ${formatNumber(remaining)}` },
  };
}

function chainQuestion(rng: Rng, difficulty: Difficulty): Question {
  const max = difficulty === 'standard' ? 40_000 : 300_000;
  const a = rng.int(1000, max);
  const b = rng.int(100, Math.min(a, max / 2));
  const c = rng.int(100, max / 2);
  // a - b + c, guaranteed non-negative intermediate since b <= a
  const intermediate = a - b;
  const result = intermediate + c;
  const choices = buildChoices(rng, result, [
    () => a + b - c, // sign confusion
    () => a - b - c,
    () => transposeDigits(result, rng),
    () => wrongPlaceValue(result, rng),
  ], formatNumber);

  return {
    id: `as-chain-${a}-${b}-${c}`,
    prompt: {
      en: `${formatNumber(a)} - ${formatNumber(b)} + ${formatNumber(c)} = ?`,
      zh: `${formatNumber(a)} - ${formatNumber(b)} + ${formatNumber(c)} = ?`,
    },
    choices,
    answer: formatNumber(result),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${formatNumber(a)} - ${formatNumber(b)} = ${formatNumber(intermediate)}, then ${formatNumber(intermediate)} + ${formatNumber(c)} = ${formatNumber(result)}.`,
      zh: `${formatNumber(a)} - ${formatNumber(b)} = ${formatNumber(intermediate)}，再 ${formatNumber(intermediate)} + ${formatNumber(c)} = ${formatNumber(result)}。`,
    },
  };
}

function missingNumberQuestion(rng: Rng, difficulty: Difficulty): Question {
  const max = difficulty === 'standard' ? 40_000 : 300_000;
  const isAdd = rng.chance(0.5);
  const known = rng.int(1000, max);
  const missing = rng.int(100, max);

  if (isAdd) {
    const total = known + missing;
    return {
      id: `as-missing-add-${known}-${total}`,
      prompt: {
        en: `□ + ${formatNumber(known)} = ${formatNumber(total)}. What is □?`,
        zh: `□ + ${formatNumber(known)} = ${formatNumber(total)}。□代表什么数字？`,
      },
      answer: String(missing),
      kind: 'numeric',
      topic: meta.id,
      explain: { en: `${formatNumber(total)} - ${formatNumber(known)} = ${formatNumber(missing)}`, zh: `${formatNumber(total)} - ${formatNumber(known)} = ${formatNumber(missing)}` },
    };
  }
  const total = known + missing; // known - missing style: total - known's complement
  return {
    id: `as-missing-sub-${total}-${known}`,
    prompt: {
      en: `${formatNumber(total)} - □ = ${formatNumber(known)}. What is □?`,
      zh: `${formatNumber(total)} - □ = ${formatNumber(known)}。□代表什么数字？`,
    },
    answer: String(missing),
    kind: 'numeric',
    topic: meta.id,
    explain: { en: `${formatNumber(total)} - ${formatNumber(known)} = ${formatNumber(missing)}`, zh: `${formatNumber(total)} - ${formatNumber(known)} = ${formatNumber(missing)}` },
  };
}

export function generate(rng: Rng, difficulty: Difficulty): Question {
  if (difficulty === 'standard') {
    const kind = rng.pick(['add', 'sub', 'word'] as const);
    if (kind === 'add') return plainAdd(rng, difficulty);
    if (kind === 'sub') return plainSub(rng, difficulty);
    return wordProblem(rng, difficulty);
  }
  const kind = rng.pick(['chain', 'missing', 'word'] as const);
  if (kind === 'chain') return chainQuestion(rng, difficulty);
  if (kind === 'missing') return missingNumberQuestion(rng, difficulty);
  return wordProblem(rng, difficulty);
}
