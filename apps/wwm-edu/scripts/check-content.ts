import assert from 'node:assert/strict';
import { REPO_PACKS, sampleBank, ENGLISH_TOPICS, CHINESE_TOPICS, mergePacks } from '../src/engine/english';
import { validatePack, normalizeText } from '../src/content/schema';
import { makeRng } from '../src/engine/rng';
import { generateSession, generateDailySession, generateReviewSession, MIXED_TOPIC_ID, questionFingerprint, scoredSessionAnswers } from '../src/engine/session';
import { MATH_GENERATORS } from '../src/engine/math';
import type { AnswerRecord, Question } from '../src/engine/types';
import { applyReviewProgress, getDueReviewSkills, starsForSession, type EduState } from '../src/store/local';
import { CONSTRUCTED_TOPICS, validateConstructedContent } from '../src/engine/constructed';
import { visualGeometry } from '../src/components/visual-geometry';

function emptyState(): EduState {
  return { lang: 'en', subject: 'math', difficulty: 'standard', muted: true, perTopic: {}, englishServedIds: [], dailyResults: {}, reviewSkills: {} };
}

function numeric(text: string): number {
  return Number(text.replace(/RM|,/g, ''));
}
function rational(text: string): number {
  const match = /^(?:(\d+) )?(\d+)\/(\d+)$/.exec(text);
  return match ? Number(match[1] ?? 0) + Number(match[2]) / Number(match[3]) : numeric(text);
}
function close(actual: number, expected: number, label: string) {
  assert.ok(Math.abs(actual - expected) < 0.0000001, `${label}: ${actual} != ${expected}`);
}

export function verifyMathAnswer(q: Question): boolean {
  const text = q.prompt.en.replace(/,/g, '');
  const actual = rational(q.answer);
  // Independently evaluate plain arithmetic from the displayed question.
  const expression = /^([\d.]+) ([+×÷-]) ([\d.]+)(?: ([+×÷-]) ([\d.]+))? = \?/.exec(text);
  if (expression) {
    const op = (a: number, operator: string, b: number) => operator === '+' ? a + b : operator === '-' ? a - b : operator === '×' ? a * b : a / b;
    const result = op(Number(expression[1]), expression[2], Number(expression[3]));
    close(actual, expression[4] ? op(result, expression[4], Number(expression[5])) : result, q.id);
    return true;
  }
  if (q.id.startsWith('md-2step-')) {
    const nums = [...text.matchAll(/\d+/g)].map((m) => Number(m[0]));
    close(actual, nums[0] * nums[1] / nums[2], q.id);
    assert.ok(Number.isInteger(actual));
    return true;
  }
  if (q.id.startsWith('md-div-')) {
    const [, dividend, divisor, kind] = /^md-div-(\d+)-(\d+)-([rq])/.exec(q.id)!;
    close(actual, kind === 'r' ? Number(dividend) % Number(divisor) : Math.floor(Number(dividend) / Number(divisor)), q.id);
    assert.ok(Number(dividend) <= 100000);
    if (kind === 'q') assert.ok(text.includes('whole-number quotient'));
    return true;
  }
  if (q.id.startsWith('cr-point-')) {
    const [, a, b, steps, tier] = /^cr-point-(\d+)-(\d+)-(\d+)-(standard|advanced)/.exec(q.id)!;
    assert.equal(q.answer, `(${Number(a) + (tier === 'advanced' ? Number(steps) : 0)}, ${b})`);
    return true;
  }
  if (q.id.startsWith('cr-ratio-')) {
    const [, red, blue] = /uses (\d+) red beads and (\d+) blue/.exec(text)!;
    const [x, y] = q.answer.split(':').map(Number);
    close(Number(red) / Number(blue), x / y, q.id);
    return true;
  }
  if (q.id.startsWith('cr-scale-')) {
    const [, factor, red] = /needs (\d+) blue beads.*for (\d+) red/.exec(text)!;
    close(actual, Number(factor) * Number(red), q.id);
    return true;
  }
  if (q.id.startsWith('cr-unitary-')) {
    const [, n, cost, wanted] = /^(\d+) identical notebooks cost RM(\d+).*do (\d+) notebooks/.exec(text)!;
    close(actual, Number(cost) / Number(n) * Number(wanted), q.id);
    return true;
  }
  if (q.id.startsWith('data-')) {
    const counts = [...text.matchAll(/4[ABC]: (■+)/g)].map((m) => m[1].length);
    const scale = Number(/(?:means|represents) (\d+) books/.exec(text)![1]);
    const values = counts.map((n) => n * scale);
    if (text.includes('collected the most')) assert.equal(q.answer, ['4A', '4B', '4C'][values.indexOf(Math.max(...values))]);
    else if (text.includes('collect altogether')) close(actual, values.reduce((a, b) => a + b), q.id);
    else if (text.includes('fewest')) close(actual, Math.max(...values) - Math.min(...values), q.id);
    else close(actual, Number(/reach (\d+) books/.exec(text)![1]) - values[0], q.id);
    return true;
  }
  if (q.id.startsWith('money-budget-record-')) {
    const [, budget, transport, lunch] = /budget of RM(\d+).*costs RM(\d+).*costs RM(\d+)/.exec(text)!;
    close(actual, Number(budget) - Number(transport) - Number(lunch), q.id);
    return true;
  }
  if (q.id.startsWith('shapes-angle-')) {
    const degree = Number(/measures (\d+)°/.exec(text)![1]);
    const expected = degree === 90 ? 'Right angle / 直角' : degree < 90 ? 'Acute angle / 锐角' : 'Obtuse angle / 钝角';
    assert.equal(q.answer, expected, q.id);
    return true;
  }
  if (q.id.startsWith('fr-')) {
    if (q.choices) {
      const values = q.choices.map(rational);
      assert.equal(values.filter((v) => Math.abs(v - actual) < 1e-9).length, 1, `Equivalent correct choices: ${q.id}`);
    }
    if (q.id.includes('compare')) {
      const values = q.choices!.map(rational);
      close(actual, text.includes('largest') ? Math.max(...values) : Math.min(...values), q.id);
      return true;
    }
    const arithmetic = /^((?:\d+ )?\d+\/\d+) ([+-]) ((?:\d+ )?\d+\/\d+) =/.exec(text);
    if (arithmetic) {
      close(actual, rational(arithmetic[1]) + (arithmetic[2] === '+' ? 1 : -1) * rational(arithmetic[3]), q.id);
      return true;
    }
    if (q.id.includes('simplest')) {
      assert.doesNotMatch(q.explain?.en ?? '', /\d+\/\d+ ÷ \d+\/\d+/);
    }
  }
  if (q.id.startsWith('wn-words-')) { assert.ok(actual <= 100000); return true; }
  return false;
}

export function checkContentIntegrity() {
  const ids = new Set<string>();
  const prompts = { en: new Set<string>(), zh: new Set<string>() };
  for (const pack of REPO_PACKS) {
    assert.ok(validatePack(pack).ok, pack.id);
    assert.ok(!ids.has(pack.id), `Duplicate pack ${pack.id}`);
    ids.add(pack.id);
    for (const q of pack.questions) {
      assert.ok(q.explain?.en.trim() && q.explain.zh.trim(), q.id);
      for (const lang of ['en', 'zh'] as const) {
        const key = `${pack.subject}:${normalizeText(q.prompt[lang])}`;
        assert.ok(!prompts[lang].has(key), `Duplicate ${lang} bank question: ${q.id}`);
        prompts[lang].add(key);
      }
      if (pack.subject === 'chinese') assert.match(q.prompt.en, /[\u3400-\u9fff]/, 'Chinese assessed text retained with English UI');
    }
    for (const tier of ['standard', 'advanced'] as const) {
      const pool = pack.questions.filter((q) => q.difficulty === tier);
      assert.ok(pool.length >= 30, `${pack.id}/${tier}: inadequate bank depth`);
    }
  }
  const chineseQuestions = REPO_PACKS.filter((pack) => pack.subject === 'chinese').flatMap((pack) => pack.questions);
  assert.equal(chineseQuestions.length, 240, 'Expected all 240 Chinese bank questions in the editorial audit');
  for (const question of chineseQuestions) {
    assert.equal(question.prompt.en, question.prompt.zh, `${question.id}: assessed Chinese must remain unchanged across interface languages`);
    assert.equal(question.explain?.en, question.explain?.zh, `${question.id}: Chinese explanation must remain unchanged across interface languages`);
    assert.doesNotMatch(question.prompt.zh, /是因为怎样？|周一|教室|橡皮和尺/, `${question.id}: non-preferred or non-idiomatic wording`);
    assert.ok(/[？。：“”……）]$/.test(question.prompt.zh), `${question.id}: prompt needs terminal punctuation`);
  }
  assert.deepEqual(validateConstructedContent(), []);
  assert.equal(starsForSession(7, 7), 3);
  assert.equal(starsForSession(5, 7), 2);
  assert.equal(starsForSession(4, 7), 1);
  assert.equal(starsForSession(3, 7), 0);
  assert.equal(starsForSession(9, 10), 3);
  let sessions = 0;
  for (const subject of ['english', 'chinese'] as const) {
    const topics = subject === 'english' ? ENGLISH_TOPICS : CHINESE_TOPICS;
    for (const topic of topics) for (const tier of ['standard', 'advanced'] as const) {
      const seenIds: string[] = [];
      const answerPositions = new Set<number>();
      for (let i = 0; i < 6; i++) {
        const questions = sampleBank(subject, topic.id, tier, 10, makeRng(`${topic.id}:${tier}:${i}`), seenIds);
        assert.equal(questions.length, 10);
        assert.equal(new Set(questions.map((q) => q.id)).size, 10);
        const allowed = new Set(REPO_PACKS.filter((p) => p.topic === topic.id).flatMap((p) => p.questions.filter((q) => q.difficulty === tier).map((q) => `${subject}:${p.id}:${q.id}`)));
        for (const q of questions) {
          assert.ok(allowed.has(q.id), `Wrong difficulty/subject: ${q.id}`);
          answerPositions.add(q.choices!.indexOf(q.answer));
          if (i < 3) assert.ok(!seenIds.includes(q.id), `${q.id}: repeated before 30-item pool exhausted`);
        }
        seenIds.push(...questions.map((q) => q.id));
        sessions++;
      }
      assert.equal(answerPositions.size, 4, 'All answer positions should be reachable');
    }
  }
  for (const generator of MATH_GENERATORS) for (const difficulty of ['standard', 'advanced'] as const) for (let i = 0; i < 20; i++) {
    const questions = generateSession(generator.meta.id, difficulty, `session-check-${i}`);
    assert.equal(questions.length, 10);
    assert.equal(new Set(questions.map(questionFingerprint)).size, 10);
    assert.deepEqual(questions, generateSession(generator.meta.id, difficulty, `session-check-${i}`));
    sessions++;
  }
  for (let day = 1; day <= 31; day++) {
    const date = `2026-10-${String(day).padStart(2, '0')}`;
    const daily = generateDailySession(date);
    assert.deepEqual(daily, generateDailySession(date));
    assert.equal(daily.filter((q) => ENGLISH_TOPICS.some((t) => t.id === q.topic)).length, 3);
    assert.equal(daily.filter((q) => CHINESE_TOPICS.some((t) => t.id === q.topic)).length, 3);
    assert.equal(new Set(daily.map(questionFingerprint)).size, 10);
  }
  for (const difficulty of ['standard', 'advanced'] as const) {
    const mixed = generateSession(MIXED_TOPIC_ID, difficulty, `three-subject-mixed-${difficulty}`);
    assert.equal(mixed.length, 10);
    assert.equal(mixed.filter((q) => MATH_GENERATORS.some((generator) => generator.meta.id === q.topic)).length, 4);
    assert.equal(mixed.filter((q) => ENGLISH_TOPICS.some((topic) => topic.id === q.topic)).length, 3);
    assert.equal(mixed.filter((q) => CHINESE_TOPICS.some((topic) => topic.id === q.topic)).length, 3);
    assert.ok(mixed.every((question) => question.difficulty === difficulty));
  }
  for (const topic of CONSTRUCTED_TOPICS) for (const difficulty of ['standard', 'advanced'] as const) {
    const one = generateSession(topic.id, difficulty, `studio:${topic.id}:${difficulty}:1`);
    const two = generateSession(topic.id, difficulty, `studio:${topic.id}:${difficulty}:2`);
    for (const questions of [one, two]) {
      assert.equal(questions.length, 10);
      assert.equal(questions.filter((question) => question.kind === 'self-check').length, 3);
      assert.equal(questions.filter((question) => question.kind !== 'self-check').length, 7);
      assert.equal(new Set(questions.map((question) => question.id)).size, 10);
      for (const question of questions.filter((item) => item.kind === 'self-check')) {
        assert.ok(question.selfReview && question.selfReview.criteria.length >= 3);
        assert.ok(question.selfReview.criteria.every((criterion) => criterion.en.trim() && criterion.zh.trim()));
      }
      const records = questions.map((question): AnswerRecord => ({ question, givenAnswer: question.answer, correct: true, scored: question.kind !== 'self-check', difficulty }));
      assert.equal(scoredSessionAnswers(records).length, 7, 'Self-checks must be excluded from objective score calculations');
      // A skipped self-check (empty draft, correct=false) must stay out of both the
      // score and the weak-area queue, exactly as App.tsx pipes a finished session.
      const skipped = records.map((record, index) => record.question.kind === 'self-check'
        ? { ...record, givenAnswer: '', correct: false }
        : { ...record, correct: index !== 0 });
      const scoredSkipped = scoredSessionAnswers(skipped);
      assert.equal(scoredSkipped.length, 7, 'Skipped self-checks must stay out of the score');
      const queue = applyReviewProgress(emptyState(), scoredSkipped, false).reviewSkills ?? {};
      assert.ok(
        Object.values(queue).every((skill) => !CONSTRUCTED_TOPICS.some((studio) => studio.id === skill.topicId)),
        'Skipped self-checks must not seed the weak-area queue',
      );
      assert.ok(scoredSessionAnswers(records).every((record) => record.question.kind !== 'self-check'));
    }
    const promptById = new Map(one.filter((question) => question.kind === 'self-check').map((question) => [question.id, question.prompt]));
    for (const question of two.filter((item) => item.kind === 'self-check')) {
      const earlier = promptById.get(question.id);
      if (earlier) assert.deepEqual(question.prompt, earlier, `${question.id}: stable id changed prompt`);
    }
    assert.ok(new Set([...one, ...two].filter((question) => question.kind === 'self-check').map((question) => normalizeText(question.prompt.en))).size >= 3);
  }

  for (const topic of ['data', 'time', 'measurement', 'shapes'] as const) {
    let visualCount = 0;
    // Both tiers: the widest angles and finest clock times are advanced-only.
    for (const tier of ['standard', 'advanced'] as const)
    for (let seed = 0; seed < 100; seed++) for (const question of generateSession(topic, tier, `visual:${topic}:${tier}:${seed}`)) {
      if (!question.visual) continue;
      visualCount++;
      assert.ok(question.visual.label.en.trim() && question.visual.label.zh.trim());
      if (question.kind === 'mcq') {
        assert.equal(question.choices?.length, 4);
        assert.equal(new Set(question.choices).size, 4);
        assert.ok(question.choices.includes(question.answer));
      }
      if (question.visual.type === 'ruler') assert.equal(Number(question.answer), question.visual.endCm - question.visual.startCm);
      // An out-of-viewBox coordinate is clipped silently in the browser.
      const geometry = visualGeometry(question.visual);
      for (const point of geometry.points) {
        assert.ok(
          point.x >= 0 && point.x <= geometry.width && point.y >= 0 && point.y <= geometry.height,
          `${question.id}: ${question.visual.type} draws (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) outside its ${geometry.width}x${geometry.height} viewBox`,
        );
      }
    }
    assert.ok(visualCount > 50, `${topic}: visual generator was not exercised enough`);
  }
  const good = structuredClone(REPO_PACKS[0]);
  for (const mutate of [
    (p: typeof good) => { p.questions[0].choices[1] = ` ${p.questions[0].choices[0]} `; },
    (p: typeof good) => { p.questions[0].explain = undefined; },
    (p: typeof good) => { p.questions[1].prompt = p.questions[0].prompt; },
    (p: typeof good) => { p.questions = p.questions.slice(0, 5); },
    (p: typeof good) => { p.topic = 'daily'; },
    (p: typeof good) => { p.version = 0; },
    (p: typeof good) => { p.subject = 'chinese'; },
  ]) {
    const malformed = structuredClone(good);
    mutate(malformed);
    assert.equal(validatePack(malformed).ok, false);
  }
  assert.equal(mergePacks([good], [{ ...good, version: good.version - 1 }])[0].version, good.version);
  assert.equal(mergePacks([good], [{ ...good, subject: 'chinese' }])[0].subject, 'english');
  assert.equal(mergePacks([good], [{ ...good, version: good.version + 1 }])[0].version, good.version + 1);

  const reviewNow = Date.UTC(2026, 8, 5);
  const reviewState: EduState = emptyState();
  const missedQuestion = generateSession('fractions', 'standard', 'review-miss')[0];
  const missed: AnswerRecord = { question: missedQuestion, givenAnswer: 'wrong', correct: false, difficulty: 'standard' };
  const queued = applyReviewProgress(reviewState, [missed], false, reviewNow);
  const due = getDueReviewSkills(queued, reviewNow);
  assert.equal(due.length, 1);
  assert.equal(due[0].topicId, 'fractions');
  const reviewQuestions = generateReviewSession(due, 10, 'review-session');
  assert.equal(reviewQuestions.length, 10);
  assert.ok(reviewQuestions.every((question) => question.topic === 'fractions' && question.difficulty === 'standard'));
  const correctReview = reviewQuestions.map((question): AnswerRecord => ({ question, givenAnswer: question.answer, correct: true, difficulty: 'standard' }));
  const stageOne = applyReviewProgress(queued, correctReview, true, reviewNow);
  assert.equal(Object.values(stageOne.reviewSkills ?? {})[0].stage, 1);
  assert.equal(getDueReviewSkills(stageOne, reviewNow).length, 0);
  const stageOneDue = Object.values(stageOne.reviewSkills ?? {})[0].nextReviewAt;
  const stageTwo = applyReviewProgress(stageOne, correctReview, true, stageOneDue);
  assert.equal(Object.values(stageTwo.reviewSkills ?? {})[0].stage, 2);
  const stageTwoDue = Object.values(stageTwo.reviewSkills ?? {})[0].nextReviewAt;
  const mastered = applyReviewProgress(stageTwo, correctReview, true, stageTwoDue);
  assert.equal(Object.keys(mastered.reviewSkills ?? {}).length, 0);
  const reset = applyReviewProgress(stageTwo, [missed], true, stageTwoDue);
  assert.equal(Object.values(reset.reviewSkills ?? {})[0].stage, 0);

  let oracles = 0;
  for (const generator of MATH_GENERATORS) for (const difficulty of ['standard', 'advanced'] as const) {
    const rng = makeRng(`oracle:${generator.meta.id}:${difficulty}`);
    for (let i = 0; i < 1000; i++) if (verifyMathAnswer(generator.generate(rng, difficulty))) oracles++;
  }
  assert.ok(oracles > 5000);
  console.log(`Content integrity: ${sessions} sessions, 31 deterministic three-subject dailies, malformed-pack/override regressions, ${oracles} independently evaluated maths answers passed.`);
}
