// Sanity check for all math generators: runs each generator 1000x per
// difficulty tier with a seeded RNG and asserts basic invariants.
// Run with: npm run check --prefix apps/wwm-edu  (or `tsx scripts/check-generators.ts`)

import { makeRng } from '../src/engine/rng';
import { MATH_GENERATORS } from '../src/engine/math';
import type { Difficulty, Question } from '../src/engine/types';

const ITERATIONS = 1000;
const DIFFICULTIES: Difficulty[] = ['standard', 'advanced'];

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

if (failures > 0) {
  console.error(`\n${failures} failure(s) found.`);
  process.exit(1);
} else {
  console.log('All generators passed sanity checks.');
}
