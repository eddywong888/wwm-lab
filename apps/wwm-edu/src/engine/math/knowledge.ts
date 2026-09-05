import type { Rng } from '../rng';
import type { Difficulty, Question } from '../types';

const PAYMENT_METHODS = [
  { answer: 'Cash / 现金', clue: { en: 'using notes and coins', zh: '使用纸币和硬币' } },
  { answer: 'Debit card / 转账卡', clue: { en: 'using a bank card linked to money already in an account', zh: '使用连接银行账户现有存款的银行卡' } },
  { answer: 'E-payment / 电子支付', clue: { en: 'scanning a QR code with a supervised device', zh: '在成人看管下用设备扫描二维码' } },
] as const;

function moneyKnowledge(rng: Rng, difficulty: Difficulty): Question {
  if (rng.chance(0.45)) {
    const method = rng.pick(PAYMENT_METHODS);
    const choices = rng.shuffle([
      method.answer,
      ...PAYMENT_METHODS.filter((item) => item !== method).map((item) => item.answer),
      'Barter / 以物易物',
    ]);
    return {
      id: `money-payment-${method.answer}-${rng.int(1, 9999)}`,
      topic: 'money',
      kind: 'mcq',
      prompt: {
        en: `A family pays for groceries ${method.clue.en}. Which payment method is described?`,
        zh: `一家人买日用品时${method.clue.zh}。这里描述的是哪一种付款方式？`,
      },
      choices,
      answer: method.answer,
      explain: {
        en: `${method.answer} matches the way the payment is made. A trusted adult should supervise a child's digital or card payment.`,
        zh: `${method.answer}符合题目所描述的付款方式。儿童使用电子或卡片付款时，应由可信任的成人看管。`,
      },
    };
  }

  const budget = rng.pick([20, 30, 40, 50]);
  const transport = rng.pick([4, 6, 8]);
  const lunch = rng.pick([6, 8, 10]);
  const required = transport + lunch;
  const want = difficulty === 'advanced' ? budget - required + rng.int(1, 8) : budget - required;
  const answer = difficulty === 'advanced' ? 'Pay for transport and lunch first / 先支付交通和午餐' : String(budget - required);
  if (difficulty === 'standard') {
    return {
      id: `money-budget-record-${budget}-${transport}-${lunch}`,
      topic: 'money',
      kind: 'numeric',
      prompt: {
        en: `A pupil records a daily budget of RM${budget}. Transport costs RM${transport} and lunch costs RM${lunch}. How many ringgit remain for saving?`,
        zh: `一名学生记录每日预算为 RM${budget}。交通费是 RM${transport}，午餐费是 RM${lunch}。还可存下多少令吉？`,
      },
      answer,
      explain: {
        en: `Record the two expenses, then subtract them: ${budget} − ${transport} − ${lunch} = RM${answer}.`,
        zh: `先记录两项支出，再相减：${budget} − ${transport} − ${lunch} = RM${answer}。`,
      },
    };
  }
  return {
    id: `money-needs-wants-${budget}-${transport}-${lunch}-${want}`,
    topic: 'money',
    kind: 'mcq',
    prompt: {
      en: `A pupil has RM${budget}. Transport costs RM${transport}, lunch costs RM${lunch}, and a wanted toy costs RM${want}. The pupil cannot afford all three. Which decision protects the pupil's needs?`,
      zh: `一名学生有 RM${budget}。交通费 RM${transport}，午餐费 RM${lunch}，想买的玩具 RM${want}，钱不够买齐三项。哪一个决定能先照顾需要？`,
    },
    choices: rng.shuffle([
      answer,
      'Buy the toy and skip lunch / 买玩具而不吃午餐',
      'Buy the toy and walk home alone / 买玩具后独自走回家',
      'Spend all the money before making a record / 还没记录就花完所有钱',
    ]),
    answer,
    explain: {
      en: `Transport and lunch are stated needs. The toy is described as a want, so needs are budgeted first.`,
      zh: `题目说明交通和午餐是需要，玩具是想要的物品，所以应先为需要编列预算。`,
    },
  };
}

function shapesKnowledge(rng: Rng, difficulty: Difficulty): Question {
  if (rng.chance(0.55)) {
    const degree = difficulty === 'standard'
      ? rng.pick([30, 45, 90, 120, 150])
      : rng.pick([15, 75, 90, 105, 165]);
    const answer = degree === 90 ? 'Right angle / 直角' : degree < 90 ? 'Acute angle / 锐角' : 'Obtuse angle / 钝角';
    return {
      id: `shapes-angle-${degree}`,
      topic: 'shapes',
      kind: 'mcq',
      prompt: {
        en: `An angle measures ${degree}°. What type of angle is it?`,
        zh: `一个角是 ${degree}°。它是哪一类角？`,
      },
      choices: rng.shuffle([
        answer,
        'Straight angle / 平角',
        ...['Right angle / 直角', 'Acute angle / 锐角', 'Obtuse angle / 钝角']
          .filter((choice) => choice !== answer)
          .slice(0, 2),
      ]),
      answer,
      explain: {
        en: `An acute angle is less than 90°, a right angle is exactly 90°, and an obtuse angle is between 90° and 180°.`,
        zh: `锐角小于 90°，直角等于 90°，钝角大于 90°而小于 180°。`,
      },
    };
  }

  const perpendicular = rng.chance(0.5);
  const answer = perpendicular ? 'Perpendicular / 垂直' : 'Parallel / 平行';
  const situation = perpendicular
    ? { en: 'A vertical grid line meets a horizontal grid line at a right angle.', zh: '方格上的竖线与横线相交成直角。' }
    : { en: 'Two straight railway tracks remain the same distance apart and never meet.', zh: '两条笔直的铁轨始终保持相同距离，永不相交。' };
  return {
    id: `shapes-lines-${perpendicular}-${rng.int(1, 9999)}`,
    topic: 'shapes',
    kind: 'mcq',
    prompt: { en: `${situation.en} How are the lines related?`, zh: `${situation.zh}这两条线有什么关系？` },
    choices: rng.shuffle([answer, perpendicular ? 'Parallel / 平行' : 'Perpendicular / 垂直', 'Curved / 曲线', 'Overlapping / 重叠']),
    answer,
    explain: perpendicular
      ? { en: 'Lines that meet at a right angle are perpendicular.', zh: '相交成直角的两条直线互相垂直。' }
      : { en: 'Lines that remain the same distance apart and never meet are parallel.', zh: '始终保持相同距离且永不相交的直线互相平行。' },
  };
}

function measurementKnowledge(rng: Rng, difficulty: Difficulty): Question {
  const items = difficulty === 'standard'
    ? [
        { object: { en: 'the mass of a paper clip', zh: '一枚回形针的质量' }, answer: 'g / 克' },
        { object: { en: 'water in a small medicine spoon', zh: '一小药匙里的液体体积' }, answer: 'mL / 毫升' },
        { object: { en: 'the length of a classroom', zh: '课室的长度' }, answer: 'm / 米' },
      ]
    : [
        { object: { en: 'the mass of a vitamin tablet', zh: '一颗维生素片的质量' }, answer: 'mg / 毫克' },
        { object: { en: 'the mass of a lorry', zh: '一辆罗里的质量' }, answer: 't / 公吨' },
        { object: { en: 'the distance between two Malaysian towns', zh: '马来西亚两个城镇之间的距离' }, answer: 'km / 千米' },
      ];
  const item = rng.pick(items);
  const choices = rng.shuffle([item.answer, 'cm / 厘米', 'kg / 千克', 'L / 升'].filter((choice, index, all) => all.indexOf(choice) === index));
  while (choices.length < 4) choices.push(choices.includes('m / 米') ? 'mm / 毫米' : 'm / 米');
  return {
    id: `measurement-unit-${item.answer}-${rng.int(1, 9999)}`,
    topic: 'measurement',
    kind: 'mcq',
    prompt: { en: `Which unit is most suitable for measuring ${item.object.en}?`, zh: `测量${item.object.zh}，最适合用哪个单位？` },
    choices: rng.shuffle(choices),
    answer: item.answer,
    explain: { en: `${item.answer} gives a sensible scale for ${item.object.en}.`, zh: `${item.answer}适合${item.object.zh}的大小范围。` },
  };
}

export function knowledgeQuestion(topic: 'money' | 'shapes' | 'measurement', rng: Rng, difficulty: Difficulty): Question {
  if (topic === 'money') return moneyKnowledge(rng, difficulty);
  if (topic === 'shapes') return shapesKnowledge(rng, difficulty);
  return measurementKnowledge(rng, difficulty);
}
