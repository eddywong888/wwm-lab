import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import { buildChoices } from '../distractors';

export function visualMathQuestion(topic: 'data' | 'time' | 'measurement' | 'shapes', rng: Rng, difficulty: Difficulty): Question {
  if (topic === 'data') {
    const categories = ['4A', '4B', '4C'];
    const values = rng.shuffle(difficulty === 'standard' ? [12, 18, 9, 15] : [24, 32, 19, 27]).slice(0, 3);
    const askTotal = difficulty === 'advanced';
    const answer = askTotal ? values.reduce((sum, value) => sum + value, 0) : Math.max(...values);
    return { id: `visual-data-${values.join('-')}-${difficulty}`, topic, kind: 'mcq', difficulty,
      prompt: askTotal ? { en: 'The bar chart shows books read by three classes. How many books did they read altogether?', zh: '条形统计图显示三个班级的阅读量。他们一共读了多少本书？' } : { en: 'The bar chart shows books read by three classes. What is the greatest number shown?', zh: '条形统计图显示三个班级的阅读量。图中最大的数量是多少？' },
      visual: { type: 'bar-chart', label: { en: `Bar chart: 4A ${values[0]} books, 4B ${values[1]} books, 4C ${values[2]} books.`, zh: `条形统计图：4A班${values[0]}本，4B班${values[1]}本，4C班${values[2]}本。` }, categories, values, unit: { en: 'Books', zh: '本数' } },
      choices: buildChoices(rng, answer, [() => answer + values[0], () => answer - values[2], () => answer + 5]), answer: String(answer),
      explain: askTotal ? { en: `${values.join(' + ')} = ${answer}. Add all three bars.`, zh: `${values.join(' + ')} = ${answer}。把三条柱形的数量相加。` } : { en: `The tallest bar has a value of ${answer}.`, zh: `最高的柱形表示${answer}本。` } };
  }
  if (topic === 'time') {
    const hour = rng.int(1, 12); const minute = rng.pick(difficulty === 'standard' ? [0, 15, 30, 45] : [5, 10, 20, 25, 35, 40, 50, 55]);
    const answer = `${hour}:${String(minute).padStart(2, '0')}`;
    const candidates = [`${hour}:${String((minute + 30) % 60).padStart(2, '0')}`, `${hour % 12 + 1}:${String(minute).padStart(2, '0')}`, `${hour === 1 ? 12 : hour - 1}:${String(minute).padStart(2, '0')}`, `${hour}:${String((minute + 15) % 60).padStart(2, '0')}`, `${hour}:${String((minute + 45) % 60).padStart(2, '0')}`];
    const choices = [...new Set([answer, ...candidates])].slice(0, 4);
    return { id: `visual-clock-${hour}-${minute}`, topic, kind: 'mcq', difficulty, prompt: { en: 'What time does the clock show?', zh: '时钟显示什么时间？' }, visual: { type: 'clock', hour, minute, label: { en: `An analogue clock showing ${answer}.`, zh: `显示${answer}的指针时钟。` } }, choices: rng.shuffle(choices), answer, explain: { en: `The hour hand has passed ${hour}, and the minute hand points to ${minute} minutes, so the time is ${answer}.`, zh: `时针已过${hour}时，分针指向${minute}分，所以时间是${answer}。` } };
  }
  if (topic === 'shapes') {
    const degrees = rng.pick(difficulty === 'standard' ? [45, 90, 120] : [35, 75, 110, 145]);
    const answer = degrees < 90 ? 'Acute angle / 锐角' : degrees === 90 ? 'Right angle / 直角' : 'Obtuse angle / 钝角';
    return { id: `visual-angle-${degrees}`, topic, kind: 'mcq', difficulty, prompt: { en: 'Classify the angle shown.', zh: '判断图中角的种类。' }, visual: { type: 'angle', degrees, label: { en: `An angle measuring ${degrees} degrees.`, zh: `一个${degrees}度的角。` } }, choices: rng.shuffle(['Acute angle / 锐角', 'Right angle / 直角', 'Obtuse angle / 钝角', 'Reflex angle / 优角']), answer, explain: { en: `${degrees}° is ${degrees < 90 ? 'less than' : degrees === 90 ? 'equal to' : 'greater than'} 90°.`, zh: `${degrees}°${degrees < 90 ? '小于' : degrees === 90 ? '等于' : '大于'}90°。` } };
  }
  const rulerCm = difficulty === 'standard' ? 10 : 12;
  const startCm = rng.int(1, difficulty === 'standard' ? 3 : 5);
  const endCm = rng.int(startCm + 2, rulerCm);
  const lengthCm = endCm - startCm;
  return { id: `visual-ruler-${startCm}-${endCm}`, topic, kind: 'numeric', difficulty, prompt: { en: 'The line above the ruler begins and ends at the marks shown. What is its length in centimetres?', zh: '尺上方的线段两端对着图中的刻度。这条线段长多少厘米？' }, visual: { type: 'ruler', rulerCm, startCm, endCm, label: { en: `A line above a ruler extends from the ${startCm} cm mark to the ${endCm} cm mark.`, zh: `尺上方的一条线段从${startCm}厘米刻度延伸到${endCm}厘米刻度。` } }, answer: String(lengthCm), explain: { en: `End mark ${endCm} − start mark ${startCm} = ${lengthCm} cm.`, zh: `末端刻度${endCm} − 起点刻度${startCm} = ${lengthCm}厘米。` } };
}
