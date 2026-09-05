// Sanity check for all math generators: runs each generator 1000x per
// difficulty tier with a seeded RNG and asserts basic invariants.
// Run with: npm run check --prefix apps/wwm-edu  (or `tsx scripts/check-generators.ts`)

import { makeRng } from '../src/engine/rng';
import { MATH_GENERATORS } from '../src/engine/math';
import type { Difficulty, Question } from '../src/engine/types';
import { validatePack } from '../src/content/schema';
import { BADGE_DEFS, computeBadges, newlyEarnedBadges } from '../src/engine/badges';
import type { EduState, TopicProgress } from '../src/store/local';

import grammar1 from '../src/content/english/grammar-1.json';
import vocabulary1 from '../src/content/english/vocabulary-1.json';
import sentences1 from '../src/content/english/sentences-1.json';
import comprehension1 from '../src/content/english/comprehension-1.json';

const ITERATIONS = 1000;
const DIFFICULTIES: Difficulty[] = ['standard', 'advanced'];
const MIN_QUESTIONS_PER_PACK = 60;

let failures = 0;
let totalChecked = 0;

function fail(message: string) {
  failures++;
  console.error(`FAIL: ${message}`);
}

function containsBadText(s: string): boolean {
  return /NaN|undefined|null/.test(s);
}

function checkQuestion(q: Question, generatorId: string, difficulty: Difficulty, i: number) {
  totalChecked++;
  const ctx = `${generatorId}/${difficulty}#${i} (id=${q.id})`;

  if (!q.prompt || !q.prompt.en || !q.prompt.en.trim()) fail(`${ctx}: empty English prompt`);
  if (!q.prompt || !q.prompt.zh || !q.prompt.zh.trim()) fail(`${ctx}: empty Chinese prompt`);
  if (containsBadText(q.prompt?.en ?? '')) fail(`${ctx}: bad text in English prompt: "${q.prompt.en}"`);
  if (containsBadText(q.prompt?.zh ?? '')) fail(`${ctx}: bad text in Chinese prompt: "${q.prompt.zh}"`);

  if (q.answer === undefined || q.answer === null || q.answer === '' || containsBadText(String(q.answer))) {
    fail(`${ctx}: invalid answer "${q.answer}"`);
  }

  if (q.explain) {
    if (!q.explain.en.trim() || !q.explain.zh.trim()) fail(`${ctx}: empty explain text`);
    if (containsBadText(q.explain.en) || containsBadText(q.explain.zh)) fail(`${ctx}: bad text in explain`);
  }

  if (q.kind === 'mcq') {
    if (!q.choices) {
      fail(`${ctx}: mcq question missing choices`);
    } else {
      if (q.choices.length !== 4) fail(`${ctx}: expected 4 choices, got ${q.choices.length}`);
      const unique = new Set(q.choices);
      if (unique.size !== q.choices.length) fail(`${ctx}: choices not unique: ${JSON.stringify(q.choices)}`);
      if (!q.choices.includes(q.answer)) fail(`${ctx}: answer "${q.answer}" not among choices ${JSON.stringify(q.choices)}`);
      for (const c of q.choices) {
        if (containsBadText(c)) fail(`${ctx}: bad text in choice "${c}"`);
      }
    }
  } else if (q.kind === 'numeric') {
    if (q.choices) fail(`${ctx}: numeric question should not have choices`);
    if (!/^-?\d+(\.\d+)?$/.test(q.answer)) fail(`${ctx}: numeric answer "${q.answer}" is not a plain number string`);
  } else {
    fail(`${ctx}: unknown kind "${q.kind}"`);
  }
}

for (const generator of MATH_GENERATORS) {
  for (const difficulty of DIFFICULTIES) {
    const rng = makeRng(`check:${generator.meta.id}:${difficulty}`);
    for (let i = 0; i < ITERATIONS; i++) {
      let q: Question;
      try {
        q = generator.generate(rng, difficulty);
      } catch (err) {
        fail(`${generator.meta.id}/${difficulty}#${i}: generator threw: ${(err as Error).message}`);
        continue;
      }
      checkQuestion(q, generator.meta.id, difficulty, i);
    }
  }
}

console.log(`Checked ${totalChecked} generated questions across ${MATH_GENERATORS.length} generators x ${DIFFICULTIES.length} difficulties.`);

// --- English question banks -------------------------------------------
console.log('\nValidating English question banks...');

const RAW_PACKS: { file: string; data: unknown }[] = [
  { file: 'grammar-1.json', data: grammar1 },
  { file: 'vocabulary-1.json', data: vocabulary1 },
  { file: 'sentences-1.json', data: sentences1 },
  { file: 'comprehension-1.json', data: comprehension1 },
];

let totalBankQuestions = 0;
let totalStandard = 0;
let totalAdvanced = 0;

for (const { file, data } of RAW_PACKS) {
  const result = validatePack(data);
  if (!result.ok) {
    fail(`${file}: pack failed validation:\n  ${result.errors.join('\n  ')}`);
    continue;
  }
  const { pack } = result;
  const count = pack.questions.length;
  const standardCount = pack.questions.filter((q) => q.difficulty === 'standard').length;
  const advancedCount = pack.questions.filter((q) => q.difficulty === 'advanced').length;
  totalBankQuestions += count;
  totalStandard += standardCount;
  totalAdvanced += advancedCount;

  if (count < MIN_QUESTIONS_PER_PACK) {
    fail(`${file}: only ${count} questions, expected at least ${MIN_QUESTIONS_PER_PACK}`);
  }

  console.log(`  ${file} (topic=${pack.topic}): ${count} questions (${standardCount} standard / ${advancedCount} advanced)`);
}

console.log(`\nEnglish banks total: ${RAW_PACKS.length} packs, ${totalBankQuestions} questions (${totalStandard} standard / ${totalAdvanced} advanced).`);

// --- Badges (Phase 4) --------------------------------------------------
console.log('\nChecking badge computation (src/engine/badges.ts)...');

function progress(attempts: number, correct: number, bestStreak: number, stars: number): TopicProgress {
  return { attempts, correct, bestStreak, stars };
}

function baseState(overrides: Partial<EduState> = {}): EduState {
  return {
    lang: 'en',
    difficulty: 'standard',
    muted: false,
    perTopic: {},
    englishServedIds: [],
    dailyResults: {},
    ...overrides,
  };
}

function badgeCheck(label: string, condition: boolean) {
  totalChecked++;
  if (!condition) fail(`badges: ${label}`);
}

// (a) empty state earns zero badges, every tier null
{
  const empty = computeBadges(baseState());
  badgeCheck('empty state has exactly BADGE_DEFS.length entries', empty.length === BADGE_DEFS.length);
  for (const b of empty) {
    badgeCheck(`empty state: ${b.def.id} tier is null (got ${b.tier})`, b.tier === null);
    badgeCheck(`empty state: ${b.def.id} value is 0 (got ${b.value})`, b.value === 0);
  }
}

// Real topic ids to use as fixtures (excludes mixed/english-mixed/daily pseudo-ids).
const mathIds = MATH_GENERATORS.map((g) => g.meta.id);
const englishIds = ['grammar', 'vocabulary', 'sentences', 'comprehension'];

function stateForTopicMaster(masteredCount: number): EduState {
  const ids = [...mathIds, ...englishIds].slice(0, masteredCount);
  const perTopic: Record<string, TopicProgress> = {};
  for (const id of ids) perTopic[id] = progress(10, 10, 5, 3);
  return baseState({ perTopic });
}

function stateForStreakHero(streak: number): EduState {
  return baseState({ perTopic: { 'fake-streak-topic': progress(10, 10, streak, 1) } });
}

function stateForDailyRegular(days: number): EduState {
  const dailyResults: EduState['dailyResults'] = {};
  for (let i = 0; i < days; i++) {
    const date = `2026-01-${String(i + 1).padStart(2, '0')}`;
    dailyResults![date] = { date, score: 5, bestStreak: 3 };
  }
  return baseState({ dailyResults });
}

function stateForDailyPerfect(perfectDays: number): EduState {
  const dailyResults: EduState['dailyResults'] = {};
  for (let i = 0; i < perfectDays; i++) {
    const date = `2026-02-${String(i + 1).padStart(2, '0')}`;
    dailyResults![date] = { date, score: 10, bestStreak: 10 };
  }
  return baseState({ dailyResults });
}

function stateForQuestionCrusher(attempts: number): EduState {
  return baseState({ perTopic: { 'fake-crusher-topic': progress(attempts, Math.floor(attempts / 2), 3, 1) } });
}

function stateForSharpShooter(attempts: number, correct: number): EduState {
  return baseState({ perTopic: { 'fake-accuracy-topic': progress(attempts, correct, 3, 1) } });
}

function stateForMathExplorer(topicCount: number): EduState {
  const perTopic: Record<string, TopicProgress> = {};
  for (const id of mathIds.slice(0, topicCount)) perTopic[id] = progress(1, 1, 1, 0);
  return baseState({ perTopic });
}

function stateForWordWizard(topicCount: number): EduState {
  const perTopic: Record<string, TopicProgress> = {};
  for (const id of englishIds.slice(0, topicCount)) perTopic[id] = progress(1, 1, 1, 0);
  return baseState({ perTopic });
}

function tierOf(state: EduState, badgeId: string) {
  return computeBadges(state).find((b) => b.def.id === badgeId)!;
}

function badgeDef(badgeId: string) {
  return BADGE_DEFS.find((d) => d.id === badgeId)!;
}

// (b) crossing bronze threshold earns exactly bronze
{
  const cases: [string, (n: number) => EduState][] = [
    ['topic-master', stateForTopicMaster],
    ['streak-hero', stateForStreakHero],
    ['daily-regular', stateForDailyRegular],
    ['daily-perfect', stateForDailyPerfect],
    ['question-crusher', stateForQuestionCrusher],
    ['math-explorer', stateForMathExplorer],
    ['word-wizard', stateForWordWizard],
  ];
  for (const [id, build] of cases) {
    const bronze = badgeDef(id).tiers[0].threshold;
    const b = tierOf(build(bronze), id);
    badgeCheck(`${id} at bronze threshold (${bronze}) earns bronze (got ${b.tier})`, b.tier === 'bronze');
  }
  // sharp-shooter needs its own two-arg fixture (accuracy % gated by attempts >= 100)
  const bronzeAcc = badgeDef('sharp-shooter').tiers[0].threshold;
  const b = tierOf(stateForSharpShooter(100, bronzeAcc), 'sharp-shooter');
  badgeCheck(`sharp-shooter at bronze accuracy (${bronzeAcc}%) earns bronze (got ${b.tier})`, b.tier === 'bronze');
}

// (c) crossing gold threshold earns exactly gold
{
  const cases: [string, (n: number) => EduState][] = [
    ['topic-master', stateForTopicMaster],
    ['streak-hero', stateForStreakHero],
    ['daily-regular', stateForDailyRegular],
    ['daily-perfect', stateForDailyPerfect],
    ['question-crusher', stateForQuestionCrusher],
    ['math-explorer', stateForMathExplorer],
    ['word-wizard', stateForWordWizard],
  ];
  for (const [id, build] of cases) {
    const gold = badgeDef(id).tiers[2].threshold;
    const b = tierOf(build(gold), id);
    badgeCheck(`${id} at gold threshold (${gold}) earns gold (got ${b.tier}, value ${b.value})`, b.tier === 'gold');
    badgeCheck(`${id} at gold tier has next === null`, b.next === null);
  }
  const goldAcc = badgeDef('sharp-shooter').tiers[2].threshold;
  const b = tierOf(stateForSharpShooter(100, goldAcc), 'sharp-shooter');
  badgeCheck(`sharp-shooter at gold accuracy (${goldAcc}%) earns gold (got ${b.tier})`, b.tier === 'gold');
}

// (d) sharp-shooter stays unearned at 100% accuracy with only 50 attempts (below the 100-attempt gate)
{
  const b = tierOf(stateForSharpShooter(50, 50), 'sharp-shooter');
  badgeCheck(`sharp-shooter with 50/50 (100% but <100 attempts) stays unearned (got tier=${b.tier}, value=${b.value})`, b.tier === null && b.value === 0);
}

// (e) newlyEarnedBadges reports exactly the badges whose tier increased (including null -> bronze)
{
  const before = computeBadges(baseState());
  const afterState = baseState({
    perTopic: {
      'fake-streak-topic': progress(10, 10, 5, 1), // streak-hero -> bronze (5)
      ...Object.fromEntries(mathIds.slice(0, 3).map((id) => [id, progress(1, 1, 1, 0)])), // math-explorer -> bronze (3)
    },
  });
  const after = computeBadges(afterState);
  const newly = newlyEarnedBadges(before, after);
  const newlyIds = new Set(newly.map((b) => b.def.id));
  badgeCheck('newlyEarnedBadges reports exactly 2 badges', newly.length === 2);
  badgeCheck('newlyEarnedBadges includes streak-hero', newlyIds.has('streak-hero'));
  badgeCheck('newlyEarnedBadges includes math-explorer', newlyIds.has('math-explorer'));
  for (const b of newly) {
    badgeCheck(`newlyEarnedBadges entry ${b.def.id} has non-null tier`, b.tier !== null);
  }

  // Re-running with the same after state should report nothing new (tier didn't increase further).
  const stillNothing = newlyEarnedBadges(after, after);
  badgeCheck('newlyEarnedBadges(after, after) reports nothing new', stillNothing.length === 0);

  // A tier bump from bronze -> gold should also be reported.
  const goldState = baseState({
    perTopic: { 'fake-streak-topic': progress(10, 10, 10, 1) }, // streak-hero -> gold (10)
  });
  const goldAfter = computeBadges(goldState);
  const bumpedUp = newlyEarnedBadges(after, goldAfter);
  badgeCheck(
    'newlyEarnedBadges reports streak-hero bronze -> gold as newly earned',
    bumpedUp.some((b) => b.def.id === 'streak-hero' && b.tier === 'gold'),
  );
}

// (f) Daily Challenge results count toward the aggregate badges. Daily sessions
// are recorded ONLY in dailyResults (App.tsx calls recordDailyResult, not
// recordSession), so a Daily-only player must still advance question-crusher,
// sharp-shooter and streak-hero. Regression guard for a real bug caught in review.
{
  // 10 perfect daily challenges = 100 questions, 100 correct, best streak 10.
  const dailyOnly = stateForDailyPerfect(10);

  const crusher = tierOf(dailyOnly, 'question-crusher');
  badgeCheck(
    `daily-only: question-crusher counts daily questions (expected 100, got ${crusher.value})`,
    crusher.value === 100 && crusher.tier === 'bronze',
  );

  const shooter = tierOf(dailyOnly, 'sharp-shooter');
  badgeCheck(
    `daily-only: sharp-shooter passes the 100-attempt gate on dailies (got tier=${shooter.tier}, value=${shooter.value})`,
    shooter.tier === 'gold' && shooter.value === 100,
  );

  const streak = tierOf(dailyOnly, 'streak-hero');
  badgeCheck(
    `daily-only: streak-hero counts daily bestStreak (got tier=${streak.tier}, value=${streak.value})`,
    streak.tier === 'gold' && streak.value === 10,
  );

  // Mixed play: topic attempts and daily questions add up rather than shadowing.
  const mixed = baseState({
    perTopic: { 'fake-crusher-topic': progress(40, 20, 4, 1) },
    dailyResults: stateForDailyPerfect(3).dailyResults,
  });
  const mixedCrusher = tierOf(mixed, 'question-crusher');
  badgeCheck(
    `mixed play: question-crusher sums topics + dailies (expected 70, got ${mixedCrusher.value})`,
    mixedCrusher.value === 70,
  );
}

console.log(`Badge checks complete (${BADGE_DEFS.length} badge defs, ${mathIds.length} math topics, ${englishIds.length} English topics considered).`);

if (failures > 0) {
  console.error(`\n${failures} failure(s) found.`);
  process.exit(1);
} else {
  console.log('All generators passed sanity checks.');
}
