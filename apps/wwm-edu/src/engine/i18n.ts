import type { Bilingual, Lang } from './types';

export function t(bi: Bilingual, lang: Lang): string {
  return bi[lang];
}

export const UI_STRINGS = {
  appTitle: { en: 'WWM Edu', zh: '智学乐园' } satisfies Bilingual,
  tagline: { en: 'Standard 4 Daily Practice', zh: '四年级每日练习' } satisfies Bilingual,
  standard: { en: 'Standard', zh: '标准' } satisfies Bilingual,
  advanced: { en: 'Advanced', zh: '挑战' } satisfies Bilingual,
  mixedPractice: { en: 'Mixed Practice', zh: '综合练习' } satisfies Bilingual,
  bestStreak: { en: 'Best streak', zh: '最佳连胜' } satisfies Bilingual,
  start: { en: 'Start', zh: '开始' } satisfies Bilingual,
  question: { en: 'Question', zh: '第' } satisfies Bilingual,
  correct: { en: 'Correct!', zh: '答对了！' } satisfies Bilingual,
  incorrect: { en: 'Not quite!', zh: '不对哦！' } satisfies Bilingual,
  correctAnswerWas: { en: 'The correct answer is', zh: '正确答案是' } satisfies Bilingual,
  next: { en: 'Next', zh: '下一题' } satisfies Bilingual,
  finish: { en: 'Finish', zh: '完成' } satisfies Bilingual,
  yourScore: { en: 'Your Score', zh: '你的分数' } satisfies Bilingual,
  retrySameTopic: { en: 'Play Again', zh: '再玩一次' } satisfies Bilingual,
  backHome: { en: 'Back to Home', zh: '返回主页' } satisfies Bilingual,
  ok: { en: 'OK', zh: '确定' } satisfies Bilingual,
  mute: { en: 'Sound On', zh: '开启声音' } satisfies Bilingual,
  unmute: { en: 'Sound Off', zh: '关闭声音' } satisfies Bilingual,
  encourageGreat: { en: 'Amazing work! You are a math star!', zh: '太棒了！你是数学小明星！' } satisfies Bilingual,
  encourageGood: { en: 'Great job! Keep practicing!', zh: '做得好！继续加油！' } satisfies Bilingual,
  encourageOk: { en: 'Good try! Practice makes perfect.', zh: '不错的尝试！熟能生巧。' } satisfies Bilingual,
  encourageTryAgain: { en: 'Keep going, you can do it!', zh: '继续努力，你可以的！' } satisfies Bilingual,
  termOne: { en: 'First Half Year', zh: '上半年' } satisfies Bilingual,
  termTwo: { en: 'Second Half Year', zh: '下半年' } satisfies Bilingual,
};
