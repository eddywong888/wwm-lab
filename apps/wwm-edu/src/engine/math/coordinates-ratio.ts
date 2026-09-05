import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { buildChoices } from '../distractors';

export const meta: GeneratorMeta = { id: 'coordinates-ratio', name: { en: 'Coordinates & Ratio', zh: '坐标与比' }, icon: '🧭', term: 2 };
export function generate(rng: Rng, difficulty: Difficulty): Question {
  const mode = rng.int(0, 3);
  const a = rng.int(1, 9);
  const b = rng.int(1, 9);
  const steps = rng.int(1, 5);
  if (mode === 0) {
    const advanced = difficulty === 'advanced';
    const answer = `(${a + (advanced ? steps : 0)}, ${b})`;
    const choices = rng.shuffle([answer, `(${a + (advanced ? steps : 0) + 1}, ${b})`, `(${a + (advanced ? steps : 0)}, ${b + 1})`, `(0, ${b})`]);
    return { id: `cr-point-${a}-${b}-${steps}-${difficulty}`, topic: meta.id, kind: 'mcq', answer, choices,
      prompt: advanced ? { en: `On a grid, east is right and north is up. The library is at (${a}, ${b}). Mei walks ${steps} units east. What are her new coordinates?`, zh: `方格上向东为右，向北为上。图书馆在 (${a}, ${b})。美玲向东走 ${steps} 个单位后，坐标是什么？` } : { en: `From the origin (0, 0), move ${a} units right and ${b} units up. What are the coordinates?`, zh: `从原点 (0, 0) 向右走 ${a} 个单位，再向上走 ${b} 个单位。坐标是什么？` },
      explain: { en: `Write the horizontal coordinate first, then the vertical coordinate. ${advanced ? `Moving east adds ${steps} to ${a}; the vertical coordinate stays ${b}.` : `Right gives ${a}; up gives ${b}.`} The point is ${answer}.`, zh: `先写横坐标，再写纵坐标。${advanced ? `向东走使横坐标增加 ${steps}，纵坐标 ${b} 不变。` : `向右是 ${a}，向上是 ${b}。`}所以坐标是 ${answer}。` } };
  }
  const factor = difficulty === 'advanced' ? rng.pick([2, 3, 4, 5, 10, 100, 1000]) : rng.int(2, 10);
  if (mode === 1) {
    const answer = `1:${factor}`;
    return { id: `cr-ratio-${a}-${factor}`, topic: meta.id, kind: 'mcq', answer, choices: rng.shuffle([answer, `${factor}:1`, `1:${factor + 1}`, `${factor + 1}:1`]), prompt: { en: `A pattern uses ${a} red beads and ${a * factor} blue beads. What is the ratio of red beads to blue beads in simplest form?`, zh: `一个图案用了 ${a} 颗红珠和 ${a * factor} 颗蓝珠。红珠数量与蓝珠数量的最简比是什么？` }, explain: { en: `Keep red first: ${a}:${a * factor}. Divide both quantities by ${a} to get ${answer}.`, zh: `红珠在前：${a}:${a * factor}。两项同时除以 ${a}，得到 ${answer}。` } };
  }
  if (mode === 2) {
    const answer = a * factor;
    return { id: `cr-scale-${a}-${factor}`, topic: meta.id, kind: 'numeric', answer: String(answer), prompt: { en: `For every 1 red bead, a craft pattern needs ${factor} blue beads. How many blue beads are needed for ${a} red beads?`, zh: `一个手工图案每用 1 颗红珠，就需要 ${factor} 颗蓝珠。用了 ${a} 颗红珠，需要多少颗蓝珠？` }, explain: { en: `One group needs ${factor} blue beads. ${a} groups need ${a} × ${factor} = ${answer} blue beads.`, zh: `每组需要 ${factor} 颗蓝珠，${a} 组需要 ${a} × ${factor} = ${answer} 颗。` } };
  }
  const unitPrice = rng.int(2, 8);
  const wanted = a + steps;
  const answer = unitPrice * wanted;
  return { id: `cr-unitary-${a}-${unitPrice}-${wanted}`, topic: meta.id, kind: 'mcq', answer: String(answer), choices: buildChoices(rng, answer, [() => unitPrice * a, () => answer + unitPrice, () => answer - unitPrice]), prompt: { en: `${a} identical notebooks cost RM${a * unitPrice}. At the same price per notebook, how much do ${wanted} notebooks cost, in RM?`, zh: `${a} 本相同的笔记本共售 RM${a * unitPrice}。每本价格相同，${wanted} 本共售多少令吉？` }, explain: { en: `First find one notebook: ${a * unitPrice} ÷ ${a} = RM${unitPrice}. Then ${wanted} × ${unitPrice} = RM${answer}.`, zh: `先求一本的价格：${a * unitPrice} ÷ ${a} = RM${unitPrice}；再算 ${wanted} × ${unitPrice} = RM${answer}。` } };
}
