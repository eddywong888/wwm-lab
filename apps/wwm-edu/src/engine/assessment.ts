import { sampleBank } from './english';
import { MATH_GENERATORS } from './math';
import { makeRng } from './rng';
import { mathQuestions, questionFingerprint } from './session';
import type { AnswerRecord, Difficulty, Question, Subject } from './types';

export const ASSESSMENT_QUESTION_COUNT = 20;
const ASSESSMENT_LANGUAGE_TOPICS = {
  english: ['grammar', 'vocabulary', 'sentences', 'comprehension'],
  chinese: ['chinese-vocabulary', 'chinese-sentences', 'chinese-comprehension', 'chinese-writing'],
} as const;

export function assessmentSourceId(id: string): string {
  return id.replace(/-assessment-\d+$/, '');
}

export function generateAssessmentPaper(
  subject: Subject,
  difficulty: Difficulty,
  seed: string | number = Date.now(),
  excludeIds: readonly string[] = [],
): Question[] {
  const rng = makeRng(`assessment-${subject}-${difficulty}-${seed}`);
  let questions: Question[];

  if (subject === 'math') {
    questions = mathQuestions('mixed', difficulty, ASSESSMENT_QUESTION_COUNT, rng);
  } else {
    questions = ASSESSMENT_LANGUAGE_TOPICS[subject].flatMap((topic) => sampleBank(subject, topic, difficulty, 5, rng, excludeIds));
  }

  return rng.shuffle(questions).map((question, index) => ({
    ...question,
    id: `${question.id}-assessment-${index}`,
    difficulty,
  }));
}

export function assessmentAnswersMatch(question: Question, given: string): boolean {
  const actual = given.trim();
  const expected = question.answer.trim();
  if (!actual) return false;
  if (actual === expected) return true;
  if (question.kind !== 'numeric') return false;
  const actualNumber = Number(actual);
  const expectedNumber = Number(expected);
  return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && actualNumber === expectedNumber;
}

export function markAssessment(
  questions: readonly Question[],
  responses: readonly string[],
  difficulty: Difficulty,
): { answers: AnswerRecord[]; correct: number; bestStreak: number } {
  let streak = 0;
  let bestStreak = 0;
  const answers = questions.map((question, index): AnswerRecord => {
    const givenAnswer = responses[index]?.trim() ?? '';
    const correct = assessmentAnswersMatch(question, givenAnswer);
    streak = correct ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
    return { question, givenAnswer, correct, scored: true, difficulty: question.difficulty ?? difficulty };
  });
  return { answers, correct: answers.filter((answer) => answer.correct).length, bestStreak };
}

export function validateAssessmentPaper(questions: readonly Question[], subject: Subject, difficulty: Difficulty): string[] {
  const errors: string[] = [];
  if (questions.length !== ASSESSMENT_QUESTION_COUNT) errors.push(`expected ${ASSESSMENT_QUESTION_COUNT} questions, got ${questions.length}`);
  if (new Set(questions.map((question) => question.id)).size !== questions.length) errors.push('question ids are not unique');
  if (new Set(questions.map(questionFingerprint)).size !== questions.length) errors.push('question prompts are not unique');
  if (questions.some((question) => question.kind === 'self-check')) errors.push('assessment papers must contain only objectively marked questions');
  if (questions.some((question) => question.difficulty !== difficulty)) errors.push('paper mixes difficulty tiers');

  if (subject === 'math') {
    const topics = new Set(questions.map((question) => question.topic));
    for (const generator of MATH_GENERATORS) if (!topics.has(generator.meta.id)) errors.push(`missing mathematics topic ${generator.meta.id}`);
  } else {
    const expectedTopics = ASSESSMENT_LANGUAGE_TOPICS[subject];
    for (const topic of expectedTopics) {
      const count = questions.filter((question) => question.topic === topic).length;
      if (count !== 5) errors.push(`${topic} has ${count} questions instead of 5`);
    }
  }
  return errors;
}
