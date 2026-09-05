import { useMemo, useRef, useState } from 'react';
import './Exercise.css';
import type { Bilingual, Difficulty, Lang } from '../engine/types';
import { MATH_GENERATORS } from '../engine/math';
import { ENGLISH_TOPICS } from '../engine/english';
import { DAILY_TOPIC_ID, MIXED_TOPIC_ID, generateSession, QUESTIONS_PER_SESSION } from '../engine/session';
import { t, UI_STRINGS } from '../engine/i18n';
import QuestionCard from '../components/QuestionCard';
import ProgressDots from '../components/ProgressDots';
import StreakBadge from '../components/StreakBadge';
import { playButtonTap, playCorrectDing, playWrongBuzz } from '../audio/sfx';

interface ExerciseProps {
  topicId: string;
  difficulty: Difficulty;
  lang: Lang;
  onFinish: (correctCount: number, totalCount: number, bestStreak: number) => void;
  onBackHome: () => void;
  sessionKey: number;
}

function topicDetails(topicId: string): { icon: string; name: Bilingual } {
  if (topicId === DAILY_TOPIC_ID) return { icon: '🗓️', name: UI_STRINGS.dailyChallenge };
  if (topicId === MIXED_TOPIC_ID) return { icon: '🎲', name: UI_STRINGS.mixedPractice };
  const math = MATH_GENERATORS.find((generator) => generator.meta.id === topicId)?.meta;
  if (math) return { icon: math.icon, name: math.name };
  const english = ENGLISH_TOPICS.find((topic) => topic.id === topicId);
  if (english) return { icon: english.icon, name: english.name };
  return { icon: '✏️', name: UI_STRINGS.practiceByTopic };
}

export default function Exercise({ topicId, difficulty, lang, onFinish, onBackHome, sessionKey }: ExerciseProps) {
  const [seedBase] = useState(() => Date.now());
  const questions = useMemo(
    () => generateSession(topicId, difficulty, `${seedBase}-${sessionKey}`),
    [topicId, difficulty, seedBase, sessionKey],
  );
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<(boolean | null)[]>(() => new Array(QUESTIONS_PER_SESSION).fill(null));
  const [streak, setStreak] = useState(0);
  const bestStreakRef = useRef(0);
  const current = questions[index];
  const topic = topicDetails(topicId);

  function handleAnswer(correct: boolean) {
    const nextResults = [...results];
    nextResults[index] = correct;
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
      const correctCount = results.filter((result) => result === true).length;
      onFinish(correctCount, questions.length, bestStreakRef.current);
      return;
    }
    setIndex((currentIndex) => currentIndex + 1);
  }

  const isLast = index + 1 >= questions.length;
  const correctSoFar = results.filter((result) => result === true).length;

  return (
    <div className="exercise">
      <header className="exercise__header">
        <button type="button" className="exercise__back" onClick={() => { playButtonTap(); onBackHome(); }} aria-label={t(UI_STRINGS.leavePractice, lang)}>←</button>
        <div className="exercise__progress-wrap">
          <div className="exercise__progress-copy">
            <span>{topic.icon} {t(topic.name, lang)}</span>
            <strong>{t(UI_STRINGS.question, lang)} {index + 1}/{questions.length}</strong>
          </div>
          <ProgressDots total={questions.length} current={index} results={results} />
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
