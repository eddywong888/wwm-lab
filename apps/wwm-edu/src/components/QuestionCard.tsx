import { useEffect, useState } from 'react';
import './QuestionCard.css';
import type { Lang, Question } from '../engine/types';
import { t, UI_STRINGS } from '../engine/i18n';
import Keypad from './Keypad';
import Mascot from './Mascot';
import { playButtonTap } from '../audio/sfx';

interface QuestionCardProps {
  question: Question;
  lang: Lang;
  onAnswer: (correct: boolean) => void;
}

type FeedbackState = 'none' | 'correct' | 'wrong';

export default function QuestionCard({ question, lang, onAnswer }: QuestionCardProps) {
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [selected, setSelected] = useState<string | null>(null);
  const [numericValue, setNumericValue] = useState('');

  useEffect(() => {
    setFeedback('none');
    setSelected(null);
    setNumericValue('');
  }, [question.id]);

  function answersMatch(given: string, expected: string): boolean {
    if (given === expected) return true;
    if (question.kind !== 'numeric') return false;
    // "25" and "20.5" must count for answers formatted as "25.00" / "20.50"
    const g = Number(given);
    const e = Number(expected);
    return Number.isFinite(g) && Number.isFinite(e) && g === e;
  }

  function submit(givenAnswer: string) {
    if (feedback !== 'none') return;
    const isCorrect = answersMatch(givenAnswer.trim(), question.answer.trim());
    setSelected(givenAnswer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    onAnswer(isCorrect);
  }

  return (
    <div className={`question-card ${feedback === 'correct' ? 'edu-bounce' : ''} ${feedback === 'wrong' ? 'edu-shake' : ''}`}>
      <p className="question-card__prompt">{t(question.prompt, lang)}</p>

      {question.kind === 'mcq' && question.choices && (
        <div className="question-card__choices">
          {question.choices.map((choice) => {
            let stateClass = '';
            if (feedback !== 'none') {
              if (choice === question.answer) stateClass = 'question-card__choice--correct';
              else if (choice === selected) stateClass = 'question-card__choice--wrong';
            }
            return (
              <button
                key={choice}
                type="button"
                className={`question-card__choice ${stateClass}`}
                disabled={feedback !== 'none'}
                onClick={() => { playButtonTap(); submit(choice); }}
              >
                {choice}
              </button>
            );
          })}
        </div>
      )}

      {question.kind === 'numeric' && (
        <Keypad
          value={numericValue}
          onChange={setNumericValue}
          onSubmit={() => submit(numericValue)}
          disabled={feedback !== 'none'}
          lang={lang}
        />
      )}

      {feedback !== 'none' && (
        <div className={`question-card__feedback question-card__feedback--${feedback}`}>
          <p className="question-card__feedback-title">
            <Mascot mood={feedback === 'correct' ? 'happy' : 'sad'} className="question-card__feedback-mascot" />
            {feedback === 'correct' ? t(UI_STRINGS.correct, lang) : t(UI_STRINGS.incorrect, lang)}
          </p>
          {feedback === 'wrong' && (
            <p className="question-card__feedback-answer">
              {t(UI_STRINGS.correctAnswerWas, lang)}: <strong>{question.answer}</strong>
            </p>
          )}
          {question.explain && (
            <p className="question-card__feedback-explain">{t(question.explain, lang)}</p>
          )}
        </div>
      )}
    </div>
  );
}
