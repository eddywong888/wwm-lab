import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { buildChoices } from '../distractors';

export const meta: GeneratorMeta = { id: 'data', name: { en: 'Data Handling', zh: '数据处理' }, icon: '📊', term: 2 };
export function generate(rng: Rng, difficulty: Difficulty): Question {
  const counts = rng.shuffle([rng.int(1, 3), rng.int(4, 6), rng.int(7, 9)]);
  const scale = difficulty === 'standard' ? rng.pick([2, 5]) : rng.pick([5, 10, 20]);
  const values = counts.map((n) => n * scale);
  const mode = rng.int(0, difficulty === 'advanced' ? 3 : 2);
  const pictograph = rng.chance(0.5);
  const labels = ['4A', '4B', '4C'];
  const data = labels.map((name, i) => `${name}: ${'■'.repeat(counts[i])}`).join('\n');
  const intro = { en: `${pictograph ? 'Pictograph' : 'Horizontal bar chart'} — books collected by three classes.\n${data}\n${pictograph ? 'Key: each ■ means' : 'Scale: each block of bar length represents'} ${scale} books.`, zh: `${pictograph ? '象形统计图' : '横式条形统计图'}——三个班收集的书本数量。\n${data}\n${pictograph ? '图例：每个 ■ 代表' : '刻度：每格条形长度代表'} ${scale} 本书。` };
  if (mode === 0) {
    const answer = labels[values.indexOf(Math.max(...values))];
    return { id: `data-most-${counts.join('-')}-${scale}-${pictograph}`, topic: meta.id, kind: 'mcq', answer, choices: rng.shuffle([...labels, 'All equal / 一样多']), prompt: { en: `${intro.en}\nWhich class collected the most books?`, zh: `${intro.zh}\n哪个班收集的书最多？` }, explain: { en: `${answer} has the most blocks (${Math.max(...counts)}): ${Math.max(...counts)} × ${scale} = ${Math.max(...values)} books.`, zh: `${answer} 的格数最多（${Math.max(...counts)} 格），代表 ${Math.max(...counts)} × ${scale} = ${Math.max(...values)} 本书。` } };
  }
  const answer = mode === 1 ? values[0] + values[1] + values[2] : mode === 2 ? Math.max(...values) - Math.min(...values) : Math.max(...values) - values[0] + scale;
  const ask = mode === 1 ? { en: 'How many books did the three classes collect altogether?', zh: '三个班一共收集了多少本书？' } : mode === 2 ? { en: 'How many more books did the class with the most collect than the class with the fewest?', zh: '最多的班比最少的班多收集了多少本书？' } : { en: `How many additional books does 4A need to reach ${Math.max(...values) + scale} books?`, zh: `4A 还要收集多少本书，才能达到 ${Math.max(...values) + scale} 本？` };
  const calculation = mode === 1 ? `${values.join(' + ')} = ${answer}` : mode === 2 ? `${Math.max(...values)} − ${Math.min(...values)} = ${answer}` : `${Math.max(...values) + scale} − ${values[0]} = ${answer}`;
  return { id: `data-${mode}-${counts.join('-')}-${scale}-${pictograph}`, topic: meta.id, kind: mode === 1 ? 'numeric' : 'mcq', answer: String(answer), ...(mode === 1 ? {} : { choices: buildChoices(rng, answer, [() => answer + scale, () => Math.max(0, answer - scale), () => answer + 1]) }), prompt: { en: `${intro.en}\n${ask.en}`, zh: `${intro.zh}\n${ask.zh}` }, explain: { en: `Multiply each block count by ${scale}: 4A = ${values[0]}, 4B = ${values[1]}, 4C = ${values[2]}. Then ${calculation} books.`, zh: `各班格数乘以 ${scale}：4A 有 ${values[0]} 本，4B 有 ${values[1]} 本，4C 有 ${values[2]} 本。再算 ${calculation} 本。` } };
}
