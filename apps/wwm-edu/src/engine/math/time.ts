import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { buildChoices } from '../distractors';

export const meta: GeneratorMeta = {
  id: 'time',
  name: { en: 'Time', zh: '时间' },
  icon: '⏰',
  term: 2,
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function splitClock(mins: number): { hour: number; minute: number; isAM: boolean } {
  const m = ((mins % 1440) + 1440) % 1440;
  const isAM = m < 720;
  let hour = Math.floor(m / 60) % 12;
  if (hour === 0) hour = 12;
  const minute = m % 60;
  return { hour, minute, isAM };
}

/** Canonical time label used for choices/answer — identical in both languages, like formatMoneySen. */
function formatTimeEN(mins: number): string {
  const { hour, minute, isAM } = splitClock(mins);
  return `${hour}:${pad2(minute)} ${isAM ? 'a.m.' : 'p.m.'}`;
}

/** Chinese-style clock text used only inside bilingual prompt/explain strings. */
function formatTimeZH(mins: number): string {
  const { hour, minute, isAM } = splitClock(mins);
  return `${isAM ? '上午' : '下午'}${hour}:${pad2(minute)}`;
}

function hoursMinutesQuestion(rng: Rng, difficulty: Difficulty): Question {
  const hours = rng.int(1, difficulty === 'standard' ? 12 : 23);
  const toMinutes = rng.chance(0.5);

  if (toMinutes) {
    const answer = hours * 60;
    return {
      id: `time-hm-tomin-${hours}`,
      prompt: {
        en: `How many minutes are there in ${hours} hour${hours > 1 ? 's' : ''}?`,
        zh: `${hours} 小时等于多少分钟？`,
      },
      answer: String(answer),
      kind: 'numeric',
      topic: meta.id,
      explain: { en: `${hours} × 60 = ${answer} minutes`, zh: `${hours} × 60 = ${answer} 分钟` },
    };
  }
  const minutes = hours * 60;
  return {
    id: `time-hm-tohr-${hours}`,
    prompt: {
      en: `How many hours are there in ${minutes} minutes?`,
      zh: `${minutes} 分钟等于多少小时？`,
    },
    answer: String(hours),
    kind: 'numeric',
    topic: meta.id,
    explain: { en: `${minutes} ÷ 60 = ${hours} hours`, zh: `${minutes} ÷ 60 = ${hours} 小时` },
  };
}

function daysWeeksMonthsYearsQuestion(rng: Rng, difficulty: Difficulty): Question {
  const useDaysWeeks = rng.chance(0.5);
  if (useDaysWeeks) {
    const weeks = rng.int(1, difficulty === 'standard' ? 8 : 20);
    const days = weeks * 7;
    const toDays = rng.chance(0.5);
    return toDays
      ? {
          id: `time-dw-todays-${weeks}`,
          prompt: { en: `How many days are there in ${weeks} week${weeks > 1 ? 's' : ''}?`, zh: `${weeks} 星期等于多少天？` },
          answer: String(days),
          kind: 'numeric',
          topic: meta.id,
          explain: { en: `${weeks} × 7 = ${days} days`, zh: `${weeks} × 7 = ${days} 天` },
        }
      : {
          id: `time-dw-toweeks-${weeks}`,
          prompt: { en: `How many weeks are there in ${days} days?`, zh: `${days} 天等于多少星期？` },
          answer: String(weeks),
          kind: 'numeric',
          topic: meta.id,
          explain: { en: `${days} ÷ 7 = ${weeks} weeks`, zh: `${days} ÷ 7 = ${weeks} 星期` },
        };
  }
  const years = rng.int(1, difficulty === 'standard' ? 5 : 15);
  const months = years * 12;
  const toMonths = rng.chance(0.5);
  return toMonths
    ? {
        id: `time-my-tomonths-${years}`,
        prompt: { en: `How many months are there in ${years} year${years > 1 ? 's' : ''}?`, zh: `${years} 年等于多少个月？` },
        answer: String(months),
        kind: 'numeric',
        topic: meta.id,
        explain: { en: `${years} × 12 = ${months} months`, zh: `${years} × 12 = ${months} 个月` },
      }
    : {
        id: `time-my-toyears-${years}`,
        prompt: { en: `How many years are there in ${months} months?`, zh: `${months} 个月等于多少年？` },
        answer: String(years),
        kind: 'numeric',
        topic: meta.id,
        explain: { en: `${months} ÷ 12 = ${years} years`, zh: `${months} ÷ 12 = ${years} 年` },
      };
}

function genSamePeriodStart(rng: Rng): { start: number; maxDuration: number } {
  const isAM = rng.chance(0.5);
  if (isAM) {
    const start = rng.int(0, 600);
    return { start, maxDuration: Math.min(180, 719 - start) };
  }
  const start = rng.int(720, 1300);
  return { start, maxDuration: Math.min(180, 1439 - start) };
}

function endTimeQuestion(rng: Rng, crossPeriod: boolean): Question {
  let start: number;
  let duration: number;
  if (crossPeriod) {
    const nearNoon = rng.chance(0.5);
    if (nearNoon) {
      start = rng.int(660, 719); // 11:00-11:59 a.m.
      duration = rng.int(5, 90);
    } else {
      start = rng.int(1380, 1439); // 11:00-11:59 p.m.
      duration = rng.int(5, 90);
    }
  } else {
    const gen = genSamePeriodStart(rng);
    start = gen.start;
    duration = rng.int(5, Math.max(gen.maxDuration, 5));
  }
  const end = start + duration;

  const choices = buildChoices(rng, end, [
    () => end + 15,
    () => end - 15,
    () => end + 30,
    () => start,
  ], formatTimeEN);

  return {
    id: `time-end-${start}-${duration}-${crossPeriod ? 'x' : 'n'}`,
    prompt: {
      en: `It is ${formatTimeEN(start)} now. What time will it be in ${duration} minutes?`,
      zh: `现在是${formatTimeZH(start)}。过 ${duration} 分钟后是几点？`,
    },
    choices,
    answer: formatTimeEN(end),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${formatTimeEN(start)} + ${duration} minutes = ${formatTimeEN(end)}`,
      zh: `${formatTimeZH(start)} + ${duration} 分钟 = ${formatTimeZH(end)}`,
    },
  };
}

function startTimeGivenDurationQuestion(rng: Rng): Question {
  const end = rng.int(60, 1439);
  const duration = rng.int(10, 120);
  const start = end - duration;

  const choices = buildChoices(rng, start, [
    () => start + 15,
    () => start - 15,
    () => start + 30,
    () => end,
  ], formatTimeEN);

  return {
    id: `time-start-${end}-${duration}`,
    prompt: {
      en: `A movie ends at ${formatTimeEN(end)}. It lasted ${duration} minutes. What time did it start?`,
      zh: `一部电影在${formatTimeZH(end)}结束，共放映了 ${duration} 分钟。它是几点开始的？`,
    },
    choices,
    answer: formatTimeEN(start),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${formatTimeEN(end)} - ${duration} minutes = ${formatTimeEN(start)}`,
      zh: `${formatTimeZH(end)} - ${duration} 分钟 = ${formatTimeZH(start)}`,
    },
  };
}

function mixedUnitConvertQuestion(rng: Rng): Question {
  const hours = rng.int(1, 5);
  const minutes = rng.int(1, 59);
  const total = hours * 60 + minutes;

  return {
    id: `time-mixed-${hours}-${minutes}`,
    prompt: {
      en: `${hours} h ${minutes} min = ? min`,
      zh: `${hours} 小时 ${minutes} 分钟 = ? 分钟`,
    },
    answer: String(total),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${hours} × 60 + ${minutes} = ${total} minutes`,
      zh: `${hours} × 60 + ${minutes} = ${total} 分钟`,
    },
  };
}

function durationBetweenQuestion(rng: Rng, crossPeriod: boolean): Question {
  let start: number;
  let duration: number;
  if (crossPeriod) {
    start = rng.int(660, 719);
    duration = rng.int(5, 90);
  } else {
    const gen = genSamePeriodStart(rng);
    start = gen.start;
    duration = rng.int(5, Math.max(gen.maxDuration, 5));
  }
  const end = start + duration;

  return {
    id: `time-duration-${start}-${end}`,
    prompt: {
      en: `How many minutes pass from ${formatTimeEN(start)} to ${formatTimeEN(end)}?`,
      zh: `从${formatTimeZH(start)}到${formatTimeZH(end)}，一共经过多少分钟？`,
    },
    answer: String(duration),
    kind: 'numeric',
    topic: meta.id,
    explain: {
      en: `${formatTimeEN(end)} - ${formatTimeEN(start)} = ${duration} minutes`,
      zh: `${formatTimeZH(end)} - ${formatTimeZH(start)} = ${duration} 分钟`,
    },
  };
}

function timetableWordProblem(rng: Rng): Question {
  const gen = genSamePeriodStart(rng);
  const start = gen.start;
  const duration = rng.int(5, Math.max(gen.maxDuration, 5));
  const end = start + duration;

  const choices = buildChoices(rng, end, [
    () => end + 10,
    () => end - 10,
    () => end + 20,
    () => start,
  ], formatTimeEN);

  return {
    id: `time-timetable-${start}-${duration}`,
    prompt: {
      en: `A bus leaves at ${formatTimeEN(start)}. The journey takes ${duration} minutes. What time does the bus arrive?`,
      zh: `一辆巴士在${formatTimeZH(start)}出发，车程需要 ${duration} 分钟。巴士几点抵达？`,
    },
    choices,
    answer: formatTimeEN(end),
    kind: 'mcq',
    topic: meta.id,
    explain: {
      en: `${formatTimeEN(start)} + ${duration} minutes = ${formatTimeEN(end)}`,
      zh: `${formatTimeZH(start)} + ${duration} 分钟 = ${formatTimeZH(end)}`,
    },
  };
}

export function generate(rng: Rng, difficulty: Difficulty): Question {
  if (difficulty === 'standard') {
    const kind = rng.pick(['hm', 'dwmy', 'endtime', 'duration', 'timetable'] as const);
    if (kind === 'hm') return hoursMinutesQuestion(rng, difficulty);
    if (kind === 'dwmy') return daysWeeksMonthsYearsQuestion(rng, difficulty);
    if (kind === 'endtime') return endTimeQuestion(rng, false);
    if (kind === 'duration') return durationBetweenQuestion(rng, false);
    return timetableWordProblem(rng);
  }
  const kind = rng.pick(['endtimeCross', 'starttime', 'mixed', 'durationCross', 'hm'] as const);
  if (kind === 'endtimeCross') return endTimeQuestion(rng, true);
  if (kind === 'starttime') return startTimeGivenDurationQuestion(rng);
  if (kind === 'mixed') return mixedUnitConvertQuestion(rng);
  if (kind === 'durationCross') return durationBetweenQuestion(rng, true);
  return hoursMinutesQuestion(rng, difficulty);
}
