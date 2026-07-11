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
  englishSection: { en: 'English', zh: '英语' } satisfies Bilingual,
  dailyChallenge: { en: 'Daily Challenge', zh: '每日挑战' } satisfies Bilingual,
  playedToday: { en: 'Played today', zh: '今日已完成' } satisfies Bilingual,

  // Phase 3 — accounts
  profile: { en: 'Profile', zh: '账户' } satisfies Bilingual,
  signIn: { en: 'Sign In', zh: '登入' } satisfies Bilingual,
  signOut: { en: 'Sign Out', zh: '登出' } satisfies Bilingual,
  nickname: { en: 'Nickname', zh: '昵称' } satisfies Bilingual,
  pin: { en: 'PIN (4-6 digits)', zh: '密码（4-6位数字）' } satisfies Bilingual,
  nicknameHint: { en: 'Pick a fun nickname — please avoid your real name.', zh: '取一个有趣的昵称，请勿使用真实姓名。' } satisfies Bilingual,
  pinHint: { en: 'Your PIN is like a secret code. Remember it to sync on another device!', zh: '密码就像一个秘密代码，记住它就能在其他设备同步进度！' } satisfies Bilingual,
  signInSubtitle: { en: "New here? This creates your profile. Played before? Enter the same nickname + PIN to restore your progress.", zh: '第一次使用？将为你创建账户。之前玩过？输入相同的昵称和密码即可恢复进度。' } satisfies Bilingual,
  signedInAs: { en: 'Signed in as', zh: '当前账户' } satisfies Bilingual,
  invalidNickname: { en: 'Nickname must be 2-16 letters, digits or spaces.', zh: '昵称须为2-16个字母、数字或空格。' } satisfies Bilingual,
  invalidPin: { en: 'PIN must be 4-6 digits.', zh: '密码须为4-6位数字。' } satisfies Bilingual,
  close: { en: 'Close', zh: '关闭' } satisfies Bilingual,
  synced: { en: 'Synced', zh: '已同步' } satisfies Bilingual,
  offline: { en: 'Offline', zh: '离线' } satisfies Bilingual,

  // Phase 3 — leaderboard
  leaderboard: { en: 'Leaderboard', zh: '排行榜' } satisfies Bilingual,
  thisWeek: { en: 'This Week', zh: '本周' } satisfies Bilingual,
  rank: { en: 'Rank', zh: '排名' } satisfies Bilingual,
  points: { en: 'pts', zh: '分' } satisfies Bilingual,
  leaderboardEmpty: { en: 'No scores yet — play the Daily Challenge to appear here!', zh: '暂无成绩——完成每日挑战即可上榜！' } satisfies Bilingual,
  leaderboardOffline: { en: "Leaderboard needs an internet connection. Try again later!", zh: '排行榜需要网络连接，请稍后再试！' } satisfies Bilingual,
  leaderboardSignInHint: { en: 'Sign in to appear on the leaderboard!', zh: '登入后即可上榜！' } satisfies Bilingual,
};
