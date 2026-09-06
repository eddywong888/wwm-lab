import { useState } from 'react';
import './QuestionCard.css';
import type { Lang, Question } from '../engine/types';
import { t, UI_STRINGS } from '../engine/i18n';
import Keypad from './Keypad';
import { playButtonTap } from '../audio/sfx';
import { isChineseTopic, isEnglishTopic } from '../engine/english';

interface QuestionCardProps {
  question: Question;
  lang: Lang;
  onAnswer: (givenAnswer: string, correct: boolean) => void;
  onNext: () => void;
  nextLabel: string;
}

type FeedbackState = 'none' | 'correct' | 'wrong';

export default function QuestionCard({ question, lang, onAnswer, onNext, nextLabel }: QuestionCardProps) {
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [selected, setSelected] = useState<string | null>(null);
  const [numericValue, setNumericValue] = useState('');
  const promptLang = isChineseTopic(question.topic) || lang === 'zh' ? 'zh-Hans' : 'en';
  const answerLang = isChineseTopic(question.topic) ? 'zh-Hans' : isEnglishTopic(question.topic) ? 'en' : promptLang;

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
    onAnswer(givenAnswer.trim(), isCorrect);
  }

  return (
    <div className={`question-card ${feedback === 'correct' ? 'edu-bounce' : ''} ${feedback === 'wrong' ? 'edu-shake' : ''}`}>
      <p className="question-card__prompt" lang={promptLang}>{t(question.prompt, lang)}</p>

      {question.kind === 'mcq' && question.choices && (
        <div className="question-card__choices">
          {question.choices.map((choice, index) => {
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
                <span className="question-card__choice-key" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                <span lang={answerLang}>{choice}</span>
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
        <div className={`question-card__feedback question-card__feedback--${feedback}`} role="status" aria-live="polite">
          <span className="question-card__feedback-icon" aria-hidden="true">{feedback === 'correct' ? '✓' : '↗'}</span>
          <div className="question-card__feedback-copy">
            <p className="question-card__feedback-title">
              {feedback === 'correct' ? t(UI_STRINGS.correct, lang) : t(UI_STRINGS.incorrect, lang)}
            </p>
            {feedback === 'wrong' && (
              <p className="question-card__feedback-answer">
                {t(UI_STRINGS.correctAnswerWas, lang)}: <strong lang={answerLang}>{question.answer}</strong>
              </p>
            )}
            {question.explain && (
              <p className="question-card__feedback-explain" lang={promptLang}>{t(question.explain, lang)}</p>
            )}
          </div>
          <button type="button" className="question-card__next" onClick={() => { playButtonTap(); onNext(); }}>
            {nextLabel} <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
