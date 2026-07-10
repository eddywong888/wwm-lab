import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { buildChoices } from '../distractors';

export const meta: GeneratorMeta = {
  id: 'measurement',
  name: { en: 'Measurement', zh: '测量' },
  icon: '📏',
  term: 2,
};

interface UnitPair {
  small: string;
  big: string;
  smallZh: string;
  bigZh: string;
  factor: number; // 1 `big` = `factor` `small`
}

const LENGTH_PAIRS: UnitPair[] = [
  { small: 'mm', big: 'cm', smallZh: '毫米', bigZh: '厘米', factor: 10 },
  { small: 'cm', big: 'm', smallZh: '厘米', bigZh: '米', factor: 100 },
  { small: 'm', big: 'km', smallZh: '米', bigZh: '千米', factor: 1000 },
];
const MASS_PAIRS: UnitPair[] = [
  { small: 'g', big: 'kg', smallZh: '克', bigZh: '千克', factor: 1000 },
];
const VOLUME_PAIRS: UnitPair[] = [
  { small: 'mL', big: 'L', smallZh: '毫升', bigZh: '升', factor: 1000 },
];

function allPairs(): UnitPair[] {
  return [...LENGTH_PAIRS, ...MASS_PAIRS, ...VOLUME_PAIRS];
}

function unitConversionQuestion(rng: Rng): Question {
  const pair = rng.pick(allPairs());
  const bigToSmall = rng.chance(0.5);

  if (bigToSmall) {
    const bigAmount = rng.int(1, 20);
    const smallAmount = bigAmount * pair.factor;
    return {
      id: `meas-conv-b2s-${pair.small}-${pair.big}-${bigAmount}`,
      prompt: {
        en: `${bigAmount} ${pair.big} = ? ${pair.small}`,
        zh: `${bigAmount} ${pair.bigZh} = ? ${pair.smallZh}`,
      },
      answer: String(smallAmount),
      kind: 'numeric',
      topic: meta.id,
      explain: {
        en: `${bigAmount} ${pair.big} × ${pair.factor} = ${smallAmount} ${pair.small}`,
        zh: `${bigAmount} ${pair.bigZh} × ${pair.factor} = ${smallAmount} ${pair.smallZh}`,
      },
    };
  }
  const bigAmount = rng.int(1, 20);
  const smallAmount = bigAmount * pair.factor;
  return {
    id: `meas-conv-s2b-${pair.small}-${pair.big}-${bigAmount}`,
    prompt: {
      en: `${smallAmount} ${pair.small} = ? ${pair.big}`,
      zh: `${smallAmount} ${pair.smallZh} = ? ${pair.bigZh}`,
    },
    answer: String(bigAmount),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${smallAmount} ${pair.small} ÷ ${pair.factor} = ${bigAmount} ${pair.big}`,
      zh: `${smallAmount} ${pair.smallZh} ÷ ${pair.factor} = ${bigAmount} ${pair.bigZh}`,
    },
  };
}

function addSubSameUnitQuestion(rng: Rng, difficulty: Difficulty): Question {
  const pair = rng.pick(allPairs());
  const unit = rng.chance(0.5) ? pair.small : pair.big;
  const unitZh = unit === pair.small ? pair.smallZh : pair.bigZh;
  const max = difficulty === 'standard' ? 500 : 5000;
  const a = rng.int(1, max);
  const b = rng.int(1, max);
  const isAdd = rng.chance(0.5);
  const bigger = Math.max(a, b);
  const smaller = Math.min(a, b);
  const result = isAdd ? a + b : bigger - smaller;

  return {
    id: `meas-addsub-${unit}-${a}-${b}-${isAdd ? 'a' : 's'}`,
    prompt: isAdd
      ? { en: `${a} ${unit} + ${b} ${unit} = ? ${unit}`, zh: `${a} ${unitZh} + ${b} ${unitZh} = ? ${unitZh}` }
      : { en: `${bigger} ${unit} - ${smaller} ${unit} = ? ${unit}`, zh: `${bigger} ${unitZh} - ${smaller} ${unitZh} = ? ${unitZh}` },
    answer: String(result),
    kind: 'numeric',
    topic: meta.id,
    explain: isAdd
      ? { en: `${a} + ${b} = ${result} ${unit}`, zh: `${a} + ${b} = ${result} ${unitZh}` }
      : { en: `${bigger} - ${smaller} = ${result} ${unit}`, zh: `${bigger} - ${smaller} = ${result} ${unitZh}` },
  };
}

function compareQuestion(rng: Rng, difficulty: Difficulty): Question {
  const pair = rng.pick(allPairs());
  const unit = rng.chance(0.5) ? pair.small : pair.big;
  const max = difficulty === 'standard' ? 500 : 5000;
  const values = new Set<number>();
  while (values.size < 4) values.add(rng.int(1, max));
  const list = [...values];
  const wantLargest = rng.chance(0.5);
  const correct = wantLargest ? Math.max(...list) : Math.min(...list);
  const choices = rng.shuffle(list.map(String));

  return {
    id: `meas-compare-${unit}-${list.join('-')}`,
    prompt: {
      en: `Which measurement is the ${wantLargest ? 'largest' : 'smallest'}? (in ${unit})`,
      zh: `哪一个量最${wantLargest ? '大' : '小'}？（单位：${unit}）`,
    },
    choices,
    answer: String(correct),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${correct} ${unit} is the ${wantLargest ? 'largest' : 'smallest'}.`,
      zh: `${correct} ${unit} 是最${wantLargest ? '大' : '小'}的。`,
    },
  };
}

function mixedUnitArithmeticQuestion(rng: Rng): Question {
  const pair = rng.pick(allPairs());
  const big1 = rng.int(1, 10);
  const small1 = rng.int(1, pair.factor - 1);
  const big2 = rng.int(1, 10);
  const small2 = rng.int(1, pair.factor - 1);
  const isAdd = rng.chance(0.5);

  const total1 = big1 * pair.factor + small1;
  const total2 = big2 * pair.factor + small2;

  if (isAdd) {
    const totalSmall = total1 + total2;
    const choices = buildChoices(rng, totalSmall, [
      () => totalSmall + pair.factor,
      () => totalSmall - pair.factor,
      () => big1 * pair.factor + big2 * pair.factor,
      () => totalSmall + 10,
    ]);
    return {
      id: `meas-mixed-add-${pair.small}-${big1}-${small1}-${big2}-${small2}`,
      prompt: {
        en: `${big1} ${pair.big} ${small1} ${pair.small} + ${big2} ${pair.big} ${small2} ${pair.small} = ? ${pair.small} (in total)`,
        zh: `${big1} ${pair.bigZh} ${small1} ${pair.smallZh} + ${big2} ${pair.bigZh} ${small2} ${pair.smallZh} = 总共 ? ${pair.smallZh}`,
      },
      choices,
      answer: String(totalSmall),
      kind: 'mcq',
      topic: meta.id,
      explain: {
        en: `${total1} ${pair.small} + ${total2} ${pair.small} = ${totalSmall} ${pair.small}`,
        zh: `${total1} ${pair.smallZh} + ${total2} ${pair.smallZh} = ${totalSmall} ${pair.smallZh}`,
      },
    };
  }
  const bigTotal = Math.max(total1, total2);
  const smallTotal = Math.min(total1, total2);
  const diff = bigTotal - smallTotal;
  const bigBig = Math.floor(bigTotal / pair.factor);
  const bigSmall = bigTotal % pair.factor;
  const smBig = Math.floor(smallTotal / pair.factor);
  const smSmall = smallTotal % pair.factor;

  const choices = buildChoices(rng, diff, [
    () => diff + pair.factor,
    () => diff - pair.factor,
    () => diff + 10,
    () => Math.max(diff - 10, 0),
  ]);
  return {
    id: `meas-mixed-sub-${pair.small}-${bigTotal}-${smallTotal}`,
    prompt: {
      en: `${bigBig} ${pair.big} ${bigSmall} ${pair.small} - ${smBig} ${pair.big} ${smSmall} ${pair.small} = ? ${pair.small} (in total)`,
      zh: `${bigBig} ${pair.bigZh} ${bigSmall} ${pair.smallZh} - ${smBig} ${pair.bigZh} ${smSmall} ${pair.smallZh} = 总共 ? ${pair.smallZh}`,
    },
    choices,
    answer: String(diff),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${bigTotal} ${pair.small} - ${smallTotal} ${pair.small} = ${diff} ${pair.small}`,
      zh: `${bigTotal} ${pair.smallZh} - ${smallTotal} ${pair.smallZh} = ${diff} ${pair.smallZh}`,
    },
  };
}

function multiStepWordProblem(rng: Rng): Question {
  const pair = rng.pick(allPairs());
  const bigAmount1 = rng.int(2, 15);
  const bigAmount2 = rng.int(1, 10);
  const totalBig = bigAmount1 + bigAmount2;
  const totalSmall = totalBig * pair.factor;

  return {
    id: `meas-word-${pair.small}-${bigAmount1}-${bigAmount2}`,
    prompt: {
      en: `A rope is ${bigAmount1} ${pair.big} long. Another rope is ${bigAmount2} ${pair.big} long. What is the total length in ${pair.small}?`,
      zh: `一条绳子长 ${bigAmount1} ${pair.bigZh}，另一条长 ${bigAmount2} ${pair.bigZh}。两条绳子共长多少${pair.smallZh}？`,
    },
    answer: String(totalSmall),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `(${bigAmount1} + ${bigAmount2}) ${pair.big} × ${pair.factor} = ${totalSmall} ${pair.small}`,
      zh: `(${bigAmount1} + ${bigAmount2}) ${pair.bigZh} × ${pair.factor} = ${totalSmall} ${pair.smallZh}`,
    },
  };
}

export function generate(rng: Rng, difficulty: Difficulty): Question {
  if (difficulty === 'standard') {
    const kind = rng.pick(['conv', 'addsub', 'compare'] as const);
    if (kind === 'conv') return unitConversionQuestion(rng);
    if (kind === 'addsub') return addSubSameUnitQuestion(rng, difficulty);
    return compareQuestion(rng, difficulty);
  }
  const kind = rng.pick(['mixed', 'word', 'conv', 'addsub'] as const);
  if (kind === 'mixed') return mixedUnitArithmeticQuestion(rng);
  if (kind === 'word') return multiStepWordProblem(rng);
  if (kind === 'conv') return unitConversionQuestion(rng);
  return addSubSameUnitQuestion(rng, difficulty);
}
