import { useMemo, useRef, useState } from 'react';
import './Exercise.css';
import type { Difficulty, Lang } from '../engine/types';
import { generateSession, QUESTIONS_PER_SESSION } from '../engine/session';
import { t, UI_STRINGS } from '../engine/i18n';
import QuestionCard from '../components/QuestionCard';
import ProgressDots from '../components/ProgressDots';
import StreakBadge from '../components/StreakBadge';
import { playCorrectDing, playWrongBuzz } from '../audio/sfx';

interface ExerciseProps {
  topicId: string;
  difficulty: Difficulty;
  lang: Lang;
  onFinish: (correctCount: number, totalCount: number, bestStreak: number) => void;
  sessionKey: number;
}

export default function Exercise({ topicId, difficulty, lang, onFinish, sessionKey }: ExerciseProps) {
  const questions = useMemo(() => generateSession(topicId, difficulty), [topicId, difficulty, sessionKey]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<(boolean | null)[]>(() => new Array(QUESTIONS_PER_SESSION).fill(null));
  const [streak, setStreak] = useState(0);
  const bestStreakRef = useRef(0);
  const [showNext, setShowNext] = useState(false);

  const current = questions[index];

  function handleAnswer(correct: boolean) {
    const nextResults = [...results];
    nextResults[index] = correct;
    setResults(nextResults);

    if (correct) {
      playCorrectDing();
      setStreak((s) => {
        const next = s + 1;
        bestStreakRef.current = Math.max(bestStreakRef.current, next);
        return next;
      });
    } else {
      playWrongBuzz();
      setStreak(0);
    }
    setShowNext(true);
  }

  function handleNext() {
    setShowNext(false);
    if (index + 1 >= questions.length) {
      const correctCount = results.filter((r) => r === true).length;
      onFinish(correctCount, questions.length, bestStreakRef.current);
      return;
    }
    setIndex((i) => i + 1);
  }

  const isLast = index + 1 >= questions.length;
  const correctSoFar = results.filter((r) => r === true).length;

  return (
    <div className="exercise">
      <div className="exercise__top">
        <ProgressDots total={questions.length} current={index} results={results} />
        <StreakBadge streak={streak} />
      </div>

      {current && (
        <QuestionCard key={current.id} question={current} lang={lang} onAnswer={handleAnswer} />
      )}

      {showNext && (
        <div className="exercise__next-wrap">
          <button type="button" className="exercise__next-btn" onClick={handleNext}>
            {isLast ? t(UI_STRINGS.finish, lang) : t(UI_STRINGS.next, lang)}
          </button>
        </div>
      )}

      <p className="exercise__score-hint">
        {t(UI_STRINGS.question, lang)} {index + 1}/{questions.length} — {correctSoFar} ✓
      </p>
    </div>
  );
}
