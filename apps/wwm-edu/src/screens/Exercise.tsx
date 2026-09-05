import { useMemo, useRef, useState } from 'react';
import './Exercise.css';
import type { AnswerRecord, Difficulty, Lang, Question } from '../engine/types';
import { generateSession } from '../engine/session';
import { t, UI_STRINGS } from '../engine/i18n';
import { topicDetails } from '../engine/topic-meta';
import QuestionCard from '../components/QuestionCard';
import ProgressDots from '../components/ProgressDots';
import StreakBadge from '../components/StreakBadge';
import { playButtonTap, playCorrectDing, playWrongBuzz } from '../audio/sfx';

interface ExerciseProps {
  topicId: string;
  difficulty: Difficulty;
  lang: Lang;
  onFinish: (answers: AnswerRecord[], bestStreak: number) => void;
  onBackHome: () => void;
  sessionKey: number;
  questionsOverride?: Question[];
}

export default function Exercise({ topicId, difficulty, lang, onFinish, onBackHome, sessionKey, questionsOverride }: ExerciseProps) {
  const [seedBase] = useState(() => Date.now());
  const questions = useMemo(
    () => questionsOverride ?? generateSession(topicId, difficulty, `${seedBase}-${sessionKey}`),
    [topicId, difficulty, seedBase, sessionKey, questionsOverride],
  );
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<(AnswerRecord | null)[]>(() => new Array(questions.length).fill(null));
  const [streak, setStreak] = useState(0);
  const bestStreakRef = useRef(0);
  const current = questions[index];
  const topic = topicDetails(topicId);

  function handleAnswer(givenAnswer: string, correct: boolean) {
    const nextResults = [...results];
    nextResults[index] = { question: current, givenAnswer, correct, difficulty: current.difficulty ?? difficulty };
    setResults(nextResults);

    if (correct) {
      playCorrectDing();
      setStreak((currentStreak) => {
        const next = currentStreak + 1;
        bestStreakRef.current = Math.max(bestStreakRef.current, next);
        return next;
      });
    } else {
      playWrongBuzz();
      setStreak(0);
    }
  }

  function handleNext() {
    if (index + 1 >= questions.length) {
      onFinish(results.filter((result): result is AnswerRecord => result !== null), bestStreakRef.current);
      return;
    }
    setIndex((currentIndex) => currentIndex + 1);
  }

  const isLast = index + 1 >= questions.length;
  const correctSoFar = results.filter((result) => result?.correct).length;

  return (
    <div className="exercise">
      <header className="exercise__header">
        <button type="button" className="exercise__back" onClick={() => { playButtonTap(); onBackHome(); }} aria-label={t(UI_STRINGS.leavePractice, lang)}>←</button>
        <div className="exercise__progress-wrap">
          <div className="exercise__progress-copy">
            <span>{topic.icon} {t(topic.name, lang)}</span>
            <strong>{t(UI_STRINGS.question, lang)} {index + 1}/{questions.length}</strong>
          </div>
          <ProgressDots total={questions.length} current={index} results={results.map((result) => result?.correct ?? null)} />
        </div>
        <StreakBadge streak={streak} />
      </header>

      <main className="exercise__workspace">
        <aside className="exercise__coach" aria-label={t(UI_STRINGS.takeYourTime, lang)}>
          <span className="exercise__coach-mascot" aria-hidden="true">🦉</span>
          <p>{t(UI_STRINGS.takeYourTime, lang)}</p>
        </aside>

        <div className="exercise__question-wrap">
          {current && (
            <QuestionCard
              key={current.id}
              question={current}
              lang={lang}
              onAnswer={handleAnswer}
              onNext={handleNext}
              nextLabel={isLast ? t(UI_STRINGS.finish, lang) : t(UI_STRINGS.next, lang)}
            />
          )}
          <p className="exercise__score-hint">{correctSoFar} ✓</p>
        </div>
      </main>
    </div>
  );
}
