// English question-bank loader + sampler. Banks are curated JSON (not
// procedurally generated) — see src/content/schema.ts for the shape and
// src/content/english/*.json for the actual content. Phase 3 adds
// KV-backed content overrides (functions/api/edu/content.ts): a pack
// fetched from the server with the same `id` as a repo pack REPLACES it;
// a new `id` is appended as an extra topic. Overrides are cached in
// localStorage so an offline player keeps the last-fetched set.
import type { Rng } from '../rng';
import type { Difficulty, GeneratorMeta, Question } from '../types';
import { validatePack, type BankQuestion, type QuestionPack } from '../../content/schema';

import grammar1 from '../../content/english/grammar-1.json';
import vocabulary1 from '../../content/english/vocabulary-1.json';
import sentences1 from '../../content/english/sentences-1.json';
import comprehension1 from '../../content/english/comprehension-1.json';

const RAW_REPO_PACKS: unknown[] = [grammar1, vocabulary1, sentences1, comprehension1];
const CONTENT_CACHE_KEY = 'wwm-edu:v1:content-overrides';

const BASE_TOPIC_META: Record<string, GeneratorMeta> = {
  grammar: { id: 'grammar', name: { en: 'Grammar', zh: '语法' }, icon: '📗' },
  vocabulary: { id: 'vocabulary', name: { en: 'Vocabulary', zh: '词汇' }, icon: '📘' },
  sentences: { id: 'sentences', name: { en: 'Sentences', zh: '句子' }, icon: '✍️' },
  comprehension: { id: 'comprehension', name: { en: 'Comprehension', zh: '阅读理解' }, icon: '📖' },
};
const BASE_TOPIC_ORDER = ['grammar', 'vocabulary', 'sentences', 'comprehension'];

function loadRepoPacks(): QuestionPack[] {
  const packs: QuestionPack[] = [];
  for (const raw of RAW_REPO_PACKS) {
    const result = validatePack(raw);
    if (!result.ok) {
      const message = `Invalid English question pack:\n${result.errors.join('\n')}`;
      // Fail loudly in dev so a bad content edit is caught immediately;
      // in production, skip the pack rather than crash the whole app.
      if (import.meta.env.DEV) throw new Error(message);
      console.error(message);
      continue;
    }
    packs.push(result.pack);
  }
  return packs;
}

function loadCachedOverrides(): QuestionPack[] {
  try {
    const raw = localStorage.getItem(CONTENT_CACHE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const packs: QuestionPack[] = [];
    for (const p of arr) {
      const result = validatePack(p);
      if (result.ok) packs.push(result.pack);
    }
    return packs;
  } catch {
    return [];
  }
}

function saveCachedOverrides(packs: QuestionPack[]): void {
  try {
    localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(packs));
  } catch {
    // localStorage unavailable — overrides just won't survive a reload offline.
  }
}

/** Repo packs with any same-id override packs replacing them in place,
 * and any new-id override packs appended at the end. */
function mergePacks(repoPacks: QuestionPack[], overridePacks: QuestionPack[]): QuestionPack[] {
  const overrideById = new Map(overridePacks.map((p) => [p.id, p]));
  const merged: QuestionPack[] = repoPacks.map((p) => overrideById.get(p.id) ?? p);
  const repoIds = new Set(repoPacks.map((p) => p.id));
  for (const p of overridePacks) {
    if (!repoIds.has(p.id)) merged.push(p);
  }
  return merged;
}

function buildTopicMeta(packs: QuestionPack[]): Record<string, GeneratorMeta> {
  const meta: Record<string, GeneratorMeta> = { ...BASE_TOPIC_META };
  for (const pack of packs) {
    if (!meta[pack.topic]) {
      meta[pack.topic] = { id: pack.topic, name: pack.title, icon: '📦' };
    }
  }
  return meta;
}

function buildTopicList(meta: Record<string, GeneratorMeta>, packs: QuestionPack[]): GeneratorMeta[] {
  const extraTopics = Array.from(new Set(packs.map((p) => p.topic))).filter((id) => !BASE_TOPIC_ORDER.includes(id));
  return [...BASE_TOPIC_ORDER, ...extraTopics].map((id) => meta[id]).filter((m): m is GeneratorMeta => !!m);
}

/** Every bank question flattened with its parent pack's topic attached. */
interface FlatBankQuestion extends BankQuestion {
  topic: string;
}

const REPO_PACKS: QuestionPack[] = loadRepoPacks();
let overridePacks: QuestionPack[] = loadCachedOverrides();
let PACKS: QuestionPack[] = mergePacks(REPO_PACKS, overridePacks);
let ALL_BANK_QUESTIONS: FlatBankQuestion[] = flattenPacks(PACKS);

function flattenPacks(packs: QuestionPack[]): FlatBankQuestion[] {
  return packs.flatMap((pack) => pack.questions.map((q) => ({ ...q, topic: pack.topic })));
}

/** Topic metadata keyed by topic id; grows to include any override-only
 * topics (a new pack's topic id that isn't one of the 4 built-in ones). */
export let ENGLISH_TOPIC_META: Record<string, GeneratorMeta> = buildTopicMeta(PACKS);

/** Topic cards for Home: the 4 built-in topics first, then any extra
 * topics contributed by content overrides, in first-seen order. */
export let ENGLISH_TOPICS: GeneratorMeta[] = buildTopicList(ENGLISH_TOPIC_META, PACKS);

/** All topic ids backed by a question bank (used by session.ts to route). */
export let ENGLISH_TOPIC_IDS: string[] = ENGLISH_TOPICS.map((t) => t.id);

/**
 * Fetch /api/edu/content, validate each pack, and merge into the live
 * bank (same-id override replaces a repo pack; new ids are appended as
 * extra topics). Caches the validated override set in localStorage so an
 * offline reload keeps the last-known set. Try/catch only — never throws,
 * resolves false on any failure (offline, or plain `vite dev` with no
 * Pages Functions running) so callers can fire this and forget.
 */
export async function refreshEnglishContent(): Promise<boolean> {
  try {
    const res = await fetch('/api/edu/content');
    if (!res.ok) return false;
    const body = (await res.json()) as { packs?: unknown[] };
    const rawPacks = Array.isArray(body.packs) ? body.packs : [];
    const validated: QuestionPack[] = [];
    for (const raw of rawPacks) {
      const result = validatePack(raw);
      if (result.ok) validated.push(result.pack);
    }
    overridePacks = validated;
    saveCachedOverrides(overridePacks);
    PACKS = mergePacks(REPO_PACKS, overridePacks);
    ALL_BANK_QUESTIONS = flattenPacks(PACKS);
    ENGLISH_TOPIC_META = buildTopicMeta(PACKS);
    ENGLISH_TOPICS = buildTopicList(ENGLISH_TOPIC_META, PACKS);
    ENGLISH_TOPIC_IDS = ENGLISH_TOPICS.map((t) => t.id);
    return true;
  } catch {
    return false;
  }
}

/** Sentinel meaning "any English topic" — used by the Daily Challenge. */
export const ENGLISH_ALL = 'all';

export function isEnglishTopic(topicId: string): boolean {
  return ENGLISH_TOPIC_IDS.includes(topicId);
}

function toQuestion(bq: FlatBankQuestion): Question {
  return {
    id: bq.id,
    prompt: bq.prompt,
    choices: bq.choices,
    answer: bq.answer,
    kind: 'mcq',
    topic: bq.topic,
    explain: bq.explain,
  };
}

/**
 * Sample `count` questions for `topicId` (or ENGLISH_ALL for any topic).
 * Prefers the requested difficulty, excluding recently served ids; falls
 * back progressively (relax exclusion, then mix in the other difficulty,
 * then allow anything in the topic) so a session is never short even if
 * the anti-repeat window has eaten most of a small pool.
 */
export function sampleEnglish(
  topicId: string,
  difficulty: Difficulty,
  count: number,
  rng: Rng,
  excludeIds: readonly string[] = [],
): Question[] {
  const excludeSet = new Set(excludeIds);
  const pool = ALL_BANK_QUESTIONS.filter((bq) => topicId === ENGLISH_ALL || bq.topic === topicId);

  const chosen: FlatBankQuestion[] = [];
  const usedIds = new Set<string>();

  function takeFrom(candidates: FlatBankQuestion[], limit: number) {
    if (limit <= 0) return;
    const shuffled = rng.shuffle(candidates.filter((bq) => !usedIds.has(bq.id)));
    for (const bq of shuffled.slice(0, limit)) {
      chosen.push(bq);
      usedIds.add(bq.id);
    }
  }

  // 1) preferred difficulty, respecting anti-repeat
  takeFrom(pool.filter((bq) => bq.difficulty === difficulty && !excludeSet.has(bq.id)), count - chosen.length);
  // 2) preferred difficulty, ignore anti-repeat (pool too small this session)
  takeFrom(pool.filter((bq) => bq.difficulty === difficulty), count - chosen.length);
  // 3) the other difficulty, respecting anti-repeat
  takeFrom(pool.filter((bq) => bq.difficulty !== difficulty && !excludeSet.has(bq.id)), count - chosen.length);
  // 4) anything left in the topic
  takeFrom(pool, count - chosen.length);

  return rng.shuffle(chosen).map(toQuestion);
}

export { PACKS as ENGLISH_PACKS };
