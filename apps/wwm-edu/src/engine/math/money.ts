import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { formatMoneySen, formatSenPlain } from '../format';
import { buildChoices } from '../distractors';

export const meta: GeneratorMeta = {
  id: 'money',
  name: { en: 'Money (RM)', zh: '金钱（RM）' },
  icon: '💰',
  term: 1,
};

const NAMES: { en: string; zh: string }[] = [
  { en: 'Ali', zh: '阿里' },
  { en: 'Mei Ling', zh: '美玲' },
  { en: 'Kumar', zh: '古马' },
  { en: 'Siti', zh: '茜蒂' },
];

const ITEMS: { en: string; zh: string; senRange: [number, number] }[] = [
  { en: 'a storybook', zh: '一本故事书', senRange: [350, 2500] },
  { en: 'a pencil box', zh: '一个铅笔盒', senRange: [500, 3500] },
  { en: 'a toy car', zh: '一辆玩具车', senRange: [800, 5000] },
  { en: 'a packet of biscuits', zh: '一包饼干', senRange: [150, 900] },
];

// All money amounts are tracked internally in sen (1/100 RM) to avoid
// floating point error, and only formatted to "RMx,xxx.xx" for display.

function senAmount(rng: Rng, difficulty: Difficulty): number {
  const maxRinggit = difficulty === 'standard' ? 500 : 10_000;
  const ringgit = rng.int(1, maxRinggit);
  const cents = rng.pick([0, 5, 10, 20, 25, 50, 55, 75, 90]);
  return ringgit * 100 + cents;
}

function addMoney(rng: Rng, difficulty: Difficulty): Question {
  const a = senAmount(rng, difficulty);
  const b = senAmount(rng, difficulty);
  const total = a + b;
  const choices = buildChoices(rng, total, [
    () => total + 100,
    () => total - 100,
    () => a + b - (b % 100) * 2, // dropped the cents
    () => total + 5,
  ], formatMoneySen);

  return {
    id: `money-add-${a}-${b}`,
    prompt: {
      en: `${formatMoneySen(a)} + ${formatMoneySen(b)} = ?`,
      zh: `${formatMoneySen(a)} + ${formatMoneySen(b)} = ?`,
    },
    choices,
    answer: formatMoneySen(total),
    kind: 'mcq',
    topic: meta.id,
    explain: { en: `${formatMoneySen(a)} + ${formatMoneySen(b)} = ${formatMoneySen(total)}`, zh: `${formatMoneySen(a)} + ${formatMoneySen(b)} = ${formatMoneySen(total)}` },
  };
}

function subMoney(rng: Rng, difficulty: Difficulty): Question {
  const a = senAmount(rng, difficulty);
  const b = senAmount(rng, difficulty);
  const bigger = Math.max(a, b);
  const smaller = Math.min(a, b);
  const diff = bigger - smaller;
  const choices = buildChoices(rng, diff, [
    () => diff + 100,
    () => diff - 100,
    () => diff + 5,
    () => bigger - smaller + 10,
  ], formatMoneySen);

  return {
    id: `money-sub-${bigger}-${smaller}`,
    prompt: {
      en: `${formatMoneySen(bigger)} - ${formatMoneySen(smaller)} = ?`,
      zh: `${formatMoneySen(bigger)} - ${formatMoneySen(smaller)} = ?`,
    },
    choices,
    answer: formatMoneySen(diff),
    kind: 'mcq',
    topic: meta.id,
    explain: { en: `${formatMoneySen(bigger)} - ${formatMoneySen(smaller)} = ${formatMoneySen(diff)}`, zh: `${formatMoneySen(bigger)} - ${formatMoneySen(smaller)} = ${formatMoneySen(diff)}` },
  };
}

function changeQuestion(rng: Rng): Question {
  const name = rng.pick(NAMES);
  const item = rng.pick(ITEMS);
  const price = rng.int(item.senRange[0], item.senRange[1]);
  // pick a payment note/coin combo bigger than price, rounded to a "clean" note value
  const noteOptions = [1000, 2000, 5000, 10_000, 5000 * 2].filter((n) => n > price);
  const payment = noteOptions.length > 0 ? Math.min(...noteOptions) : price + 1000;
  const change = payment - price;

  const choices = buildChoices(rng, change, [
    () => change + 100,
    () => change - 100,
    () => payment - price + 50,
    () => price - (payment - price) < 0 ? change + 5 : change - 5,
  ], formatMoneySen);

  return {
    id: `money-change-${price}-${payment}`,
    prompt: {
      en: `${name.en} buys ${item.en} for ${formatMoneySen(price)} and pays with ${formatMoneySen(payment)}. How much change does ${name.en} get?`,
      zh: `${name.zh}以 ${formatMoneySen(price)} 买了${item.zh}，并支付了 ${formatMoneySen(payment)}。${name.zh}应该找回多少钱？`,
    },
    choices,
    answer: formatMoneySen(change),
    kind: 'mcq',
    topic: meta.id,
    explain: { en: `${formatMoneySen(payment)} - ${formatMoneySen(price)} = ${formatMoneySen(change)}`, zh: `${formatMoneySen(payment)} - ${formatMoneySen(price)} = ${formatMoneySen(change)}` },
  };
}

function budgetWordProblem(rng: Rng): Question {
  const name = rng.pick(NAMES);
  const item1 = rng.pick(ITEMS);
  const item2 = rng.pick(ITEMS.filter((i) => i !== item1));
  const price1 = rng.int(item1.senRange[0], item1.senRange[1]);
  const price2 = rng.int(item2.senRange[0], item2.senRange[1]);
  const savings = rng.int(price1 + price2, price1 + price2 + 5000);
  const remaining = savings - price1 - price2;

  return {
    id: `money-budget-${price1}-${price2}-${savings}`,
    prompt: {
      en: `${name.en} has savings of ${formatMoneySen(savings)}. ${name.en} buys ${item1.en} for ${formatMoneySen(price1)} and ${item2.en} for ${formatMoneySen(price2)}. How much money does ${name.en} have left?`,
      zh: `${name.zh}有存款 ${formatMoneySen(savings)}。${name.zh}买了${item1.zh}，价格是 ${formatMoneySen(price1)}，又买了${item2.zh}，价格是 ${formatMoneySen(price2)}。${name.zh}还剩下多少钱？`,
    },
    answer: formatSenPlain(remaining),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${formatMoneySen(savings)} - ${formatMoneySen(price1)} - ${formatMoneySen(price2)} = ${formatMoneySen(remaining)}`,
      zh: `${formatMoneySen(savings)} - ${formatMoneySen(price1)} - ${formatMoneySen(price2)} = ${formatMoneySen(remaining)}`,
    },
  };
}

function unitPriceQuestion(rng: Rng): Question {
  const name = rng.pick(NAMES);
  const item = rng.pick(ITEMS);
  const unitPrice = rng.int(50, 999); // sen
  const qty = rng.int(2, 12);
  const total = unitPrice * qty;

  const choices = buildChoices(rng, total, [
    () => unitPrice * (qty + 1),
    () => unitPrice * (qty - 1),
    () => total + 100,
    () => total - 100,
  ], formatMoneySen);

  return {
    id: `money-unit-${unitPrice}-${qty}`,
    prompt: {
      en: `${name.en} buys ${qty} of ${item.en} at ${formatMoneySen(unitPrice)} each. What is the total cost?`,
      zh: `${name.zh}以每个 ${formatMoneySen(unitPrice)} 的价格买了 ${qty} 个${item.zh.replace('一', '')}。总共需要多少钱？`,
    },
    choices,
    answer: formatMoneySen(total),
    kind: 'mcq',
    topic: meta.id,
    explain: { en: `${formatMoneySen(unitPrice)} × ${qty} = ${formatMoneySen(total)}`, zh: `${formatMoneySen(unitPrice)} × ${qty} = ${formatMoneySen(total)}` },
  };
}

function multiItemChangeQuestion(rng: Rng): Question {
  const name = rng.pick(NAMES);
  const item1 = rng.pick(ITEMS);
  const item2 = rng.pick(ITEMS.filter((i) => i !== item1));
  const price1 = rng.int(item1.senRange[0], item1.senRange[1]);
  const price2 = rng.int(item2.senRange[0], item2.senRange[1]);
  const totalCost = price1 + price2;
  const noteOptions = [2000, 5000, 10_000, 20_000].filter((n) => n > totalCost);
  const payment = noteOptions.length > 0 ? Math.min(...noteOptions) : totalCost + 2000;
  const change = payment - totalCost;

  const choices = buildChoices(rng, change, [
    () => change + 100,
    () => change - 100,
    () => payment - price1,
    () => payment - price2,
  ], formatMoneySen);

  return {
    id: `money-multi-${price1}-${price2}-${payment}`,
    prompt: {
      en: `${name.en} buys ${item1.en} for ${formatMoneySen(price1)} and ${item2.en} for ${formatMoneySen(price2)}, paying with ${formatMoneySen(payment)}. How much change is returned?`,
      zh: `${name.zh}买了${item1.zh}（${formatMoneySen(price1)}）和${item2.zh}（${formatMoneySen(price2)}），并支付了 ${formatMoneySen(payment)}。应找回多少钱？`,
    },
    choices,
    answer: formatMoneySen(change),
    kind: 'mcq',
    topic: meta.id,
    explain: { en: `${formatMoneySen(payment)} - ${formatMoneySen(totalCost)} = ${formatMoneySen(change)}`, zh: `${formatMoneySen(payment)} - ${formatMoneySen(totalCost)} = ${formatMoneySen(change)}` },
  };
}

export function generate(rng: Rng, difficulty: Difficulty): Question {
  if (difficulty === 'standard') {
    const kind = rng.pick(['add', 'sub', 'change', 'budget'] as const);
    if (kind === 'add') return addMoney(rng, difficulty);
    if (kind === 'sub') return subMoney(rng, difficulty);
    if (kind === 'change') return changeQuestion(rng);
    return budgetWordProblem(rng);
  }
  const kind = rng.pick(['multi', 'unit', 'add', 'sub'] as const);
  if (kind === 'multi') return multiItemChangeQuestion(rng);
  if (kind === 'unit') return unitPriceQuestion(rng);
  if (kind === 'add') return addMoney(rng, difficulty);
  return subMoney(rng, difficulty);
}
