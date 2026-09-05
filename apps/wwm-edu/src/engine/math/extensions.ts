import type { Rng } from '../rng';
import type { Bilingual, Difficulty, Question } from '../types';
import { buildChoices } from '../distractors';

export function extensionQuestion(topic: string, rng: Rng, difficulty: Difficulty): Question {
  const advanced = difficulty === 'advanced';
  const a = rng.int(2, advanced ? 20 : 9);
  const b = rng.int(2, 9);
  const c = rng.int(2, 8);
  const mode = rng.int(0, 1);
  let answer = '';
  let prompt: Bilingual;
  let explain: Bilingual;
  let choices: string[] | undefined;
  switch (topic) {
    case 'whole-numbers': {
      if (mode === 0) {
        const step = advanced ? rng.pick([100, 1000, 10000]) : rng.int(1, 10);
        const start = rng.int(1, 40_000);
        answer = String(start + step * 3);
        prompt = { en: `Complete the increasing number pattern: ${start}, ${start + step}, ${start + 2 * step}, □, ${start + 4 * step}.`, zh: `完成递增数列：${start}，${start + step}，${start + 2 * step}，□，${start + 4 * step}。` };
        explain = { en: `Each step adds ${step}. ${start + step * 2} + ${step} = ${answer}. Check: ${answer} + ${step} = ${start + step * 4}.`, zh: `每次加 ${step}。${start + step * 2} + ${step} = ${answer}；检验：${answer} + ${step} = ${start + step * 4}。` };
      } else {
        const n = a * 1000 + b * 10 + c;
        answer = n % 2 ? 'Odd / 奇数' : 'Even / 偶数';
        choices = rng.shuffle(['Odd / 奇数', 'Even / 偶数', 'Both / 两者都是', 'Neither / 两者都不是']);
        prompt = { en: `Classify ${n} as odd or even.`, zh: `${n} 是奇数还是偶数？` };
        explain = { en: `The last digit is ${c}. A number is even when its last digit is 0, 2, 4, 6 or 8; otherwise it is odd.`, zh: `个位数字是 ${c}。个位是 0、2、4、6、8 的整数是偶数，其余是奇数。` };
      }
      break;
    }
    case 'add-sub': {
      const donated = a * 100 + b;
      const old = c * 100;
      const lent = advanced ? rng.int(20, 90) : 0;
      answer = String(old + donated - lent);
      prompt = { en: `A school library had ${old} books. It received ${donated} donated books.${advanced ? ` Then pupils borrowed ${lent} books.` : ''} How many books are in the library now?`, zh: `学校图书馆原有 ${old} 本书，又收到 ${donated} 本捐赠书。${advanced ? `随后学生借走了 ${lent} 本。` : ''}图书馆现在有多少本书？` };
      explain = { en: `Add the donation${advanced ? ', then subtract the books borrowed' : ''}: ${old} + ${donated}${advanced ? ` − ${lent}` : ''} = ${answer} books.`, zh: `先加上捐赠书${advanced ? '，再减去借出的书' : ''}：${old} + ${donated}${advanced ? ` − ${lent}` : ''} = ${answer} 本。` };
      break;
    }
    case 'mul-div': {
      const seats = a * b;
      const extra = advanced ? c : 0;
      const pupils = seats + extra;
      answer = String(Math.ceil(pupils / b));
      prompt = { en: `${pupils} pupils travel in vans. Each van can take at most ${b} pupils. What is the smallest number of vans needed?`, zh: `${pupils} 名学生乘客货车出游。每辆车最多载 ${b} 名学生。至少需要多少辆车？` };
      explain = { en: `${pupils} ÷ ${b} = ${Math.floor(pupils / b)} remainder ${pupils % b}. ${pupils % b ? 'The remaining pupils need another van.' : 'All pupils fit exactly.'} So ${answer} vans are needed.`, zh: `${pupils} ÷ ${b} = ${Math.floor(pupils / b)} 余 ${pupils % b}。${pupils % b ? '余下的学生还需要一辆车。' : '学生刚好坐满。'}所以需要 ${answer} 辆。` };
      break;
    }
    case 'fractions': {
      const numerator = a * b + (c % (b - 1) + 1);
      if (mode === 0) {
        answer = String(numerator);
        prompt = { en: `Write the mixed number ${a} ${(c % (b - 1) + 1)}/${b} as an improper fraction with denominator ${b}. Enter its numerator.`, zh: `把 ${a} 又 ${(c % (b - 1) + 1)}/${b} 写成分母为 ${b} 的假分数。填写分子。` };
        explain = { en: `${a} wholes = ${a * b}/${b}. Add ${(c % (b - 1) + 1)}/${b}: numerator = ${a} × ${b} + ${(c % (b - 1) + 1)} = ${answer}.`, zh: `${a} 个整体是 ${a * b}/${b}，加上 ${(c % (b - 1) + 1)}/${b}，分子为 ${a} × ${b} + ${(c % (b - 1) + 1)} = ${answer}。` };
      } else {
        answer = String(advanced ? a * (b - 1) : a);
        prompt = { en: `Siti has ${a * b} stickers. She gives ${b - 1}/${b} of them to her friends. How many stickers does she ${advanced ? 'give away' : 'keep'}?`, zh: `茜蒂有 ${a * b} 张贴纸，把其中的 ${b - 1}/${b} 送给朋友。她${advanced ? '送出' : '留下'}多少张？` };
        explain = { en: `One part is ${a * b} ÷ ${b} = ${a}. She gives ${b - 1} parts (${a * (b - 1)}) and keeps one part (${a}).`, zh: `一份有 ${a * b} ÷ ${b} = ${a} 张。送出 ${b - 1} 份，即 ${a * (b - 1)} 张；留下 1 份，即 ${a} 张。` };
      }
      break;
    }
    case 'decimals': {
      const units = a * 100 + c;
      const dp = advanced ? 3 : 2;
      const factor = mode === 0 ? b : rng.pick([10, 100, 1000]);
      const result = units / 10 ** dp;
      answer = result.toFixed(dp);
      prompt = { en: `${(result * factor).toFixed(dp)} ÷ ${factor} = ?`, zh: `${(result * factor).toFixed(dp)} ÷ ${factor} = ?` };
      explain = { en: `Divide while keeping place values aligned. Check by multiplication: ${answer} × ${factor} = ${(result * factor).toFixed(dp)}.`, zh: `按数位相除，小数点对齐。用乘法检验：${answer} × ${factor} = ${(result * factor).toFixed(dp)}。` };
      break;
    }
    case 'percentages': {
      const total = a * 20;
      const percent = rng.pick([10, 25, 50, 75]);
      const recycled = total * percent / 100;
      answer = String(advanced ? total - recycled : recycled);
      prompt = { en: `A class collected ${total} bottles. ${percent}% have been sorted for recycling. How many bottles ${advanced ? 'still need sorting' : 'have been sorted'}?`, zh: `一个班收集了 ${total} 个瓶子，已把其中的 ${percent}% 分类准备回收。${advanced ? '还有多少个瓶子未分类' : '已分类的瓶子有多少个'}？` };
      explain = { en: `Sorted: ${total} × ${percent}/100 = ${recycled}.${advanced ? ` Not sorted: ${total} − ${recycled} = ${answer}.` : ''}`, zh: `已分类：${total} × ${percent}/100 = ${recycled} 个。${advanced ? `未分类：${total} − ${recycled} = ${answer} 个。` : ''}` };
      break;
    }
    case 'money': {
      const saved = a + b;
      const weeks = c;
      answer = String(advanced ? saved * weeks - b : saved * weeks);
      prompt = { en: `Mei saves RM${saved} each week for ${weeks} weeks.${advanced ? ` She then spends RM${b} on a notebook.` : ''} How much of this money remains, in RM?`, zh: `美玲每星期存 RM${saved}，连续存了 ${weeks} 星期。${advanced ? `她接着花 RM${b} 买笔记本。` : ''}这笔钱还剩多少令吉？` };
      explain = { en: `Savings = ${saved} × ${weeks} = RM${saved * weeks}.${advanced ? ` Subtract the expense: ${saved * weeks} − ${b} = RM${answer}.` : 'Keeping a savings record helps track a goal.'}`, zh: `存款为 ${saved} × ${weeks} = RM${saved * weeks}。${advanced ? `减去支出：${saved * weeks} − ${b} = RM${answer}。` : '记录储蓄能帮助我们了解目标进度。'}` };
      break;
    }
    case 'time': {
      if (mode === 0) {
        const h = rng.int(13, 23);
        const minutes = b * 5;
        answer = `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        choices = rng.shuffle([answer, `${String(h - 12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`, `${h}:${String(minutes + 1).padStart(2, '0')}`, `${h - 1}:${String(minutes).padStart(2, '0')}`]);
        prompt = { en: `Write ${h - 12}:${String(minutes).padStart(2, '0')} p.m. using the 24-hour clock.`, zh: `把下午或晚上的 ${h - 12}:${String(minutes).padStart(2, '0')}（p.m.）改写为 24 时计时法。` };
        explain = { en: `For 1 p.m. to 11 p.m., add 12 to the hour: ${h - 12} + 12 = ${h}. Minutes stay the same.`, zh: `下午 1 时至晚上 11 时，小时加 12：${h - 12} + 12 = ${h}，分钟不变。` };
      } else {
        const unit = rng.pick([{ en: 'decades', zh: '个年代', years: 10 }, { en: 'centuries', zh: '个世纪', years: 100 }, { en: 'millennia', zh: '个千年', years: 1000 }]);
        answer = String(a * unit.years + (advanced ? b : 0));
        prompt = { en: `Convert ${a} ${unit.en}${advanced ? ` and ${b} years` : ''} to years.`, zh: `${a} ${unit.zh}${advanced ? `又 ${b} 年` : ''}共有多少年？` };
        explain = { en: `One unit is ${unit.years} years. ${a} × ${unit.years}${advanced ? ` + ${b}` : ''} = ${answer} years.`, zh: `每单位有 ${unit.years} 年。${a} × ${unit.years}${advanced ? ` + ${b}` : ''} = ${answer} 年。` };
      }
      break;
    }
    case 'measurement': {
      const each = a * 100 + b * 10;
      const bottles = c;
      const removed = advanced ? a * 10 : 0;
      answer = String(each * bottles - removed);
      prompt = { en: `${bottles} bottles each contain ${each} mL of water.${advanced ? ` Then ${removed} mL is poured away.` : ''} How much water remains altogether, in mL?`, zh: `${bottles} 瓶水，每瓶有 ${each} 毫升。${advanced ? `倒掉 ${removed} 毫升后，` : ''}总共还剩多少毫升水？` };
      explain = { en: `First multiply: ${each} × ${bottles} = ${each * bottles} mL.${advanced ? ` Then subtract ${removed} mL: ${answer} mL remains.` : ''}`, zh: `先算 ${each} × ${bottles} = ${each * bottles} 毫升。${advanced ? `再减 ${removed} 毫升，剩 ${answer} 毫升。` : ''}` };
      break;
    }
    case 'shapes': {
      const base = a * 2;
      const height = b;
      const area = base * height / 2;
      answer = String(advanced ? area * c : area);
      prompt = { en: `${advanced ? `${c} identical triangular flags each have` : 'A triangle has'} a base of ${base} cm and a perpendicular height of ${height} cm. What is ${advanced ? 'their total area' : 'its area'}, in cm²?`, zh: `${advanced ? `${c} 面相同的三角形旗子，每面` : '一个三角形的'}底为 ${base} 厘米，对应的高为 ${height} 厘米。${advanced ? '总' : ''}面积是多少平方厘米？` };
      explain = { en: `Triangle area = base × perpendicular height ÷ 2 = ${base} × ${height} ÷ 2 = ${area} cm².${advanced ? ` Multiply by ${c}: ${answer} cm².` : ''}`, zh: `三角形面积 = 底 × 高 ÷ 2 = ${base} × ${height} ÷ 2 = ${area} 平方厘米。${advanced ? `再乘 ${c}，得 ${answer} 平方厘米。` : ''}` };
      break;
    }
    default: throw new Error(`No extension for ${topic}`);
  }
  if (!choices && rng.chance(0.4)) choices = buildChoices(rng, Number(answer), [() => Number(answer) + 1, () => Math.max(0, Number(answer) - 1), () => Number(answer) + b], (n) => n === Number(answer) ? answer : String(Number(n.toFixed(3))));
  return { id: `ex-${topic}-${prompt.en}`, topic, prompt, explain, answer, kind: choices ? 'mcq' : 'numeric', ...(choices ? { choices } : {}) };
}
