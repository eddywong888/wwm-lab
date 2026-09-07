import { useState } from 'react';
import './QuestionCard.css';
import type { Lang, Question } from '../engine/types';
import { t, UI_STRINGS } from '../engine/i18n';
import Keypad from './Keypad';
import { playButtonTap } from '../audio/sfx';
import { isChineseTopic, isEnglishTopic } from '../engine/english';
import QuestionVisual from './QuestionVisual';

interface QuestionCardProps {
  question: Question;
  lang: Lang;
  onAnswer: (givenAnswer: string, correct: boolean) => void;
  onNext: () => void;
  nextLabel: string;
}

type FeedbackState = 'none' | 'correct' | 'wrong' | 'review' | 'complete';

export default function QuestionCard({ question, lang, onAnswer, onNext, nextLabel }: QuestionCardProps) {
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [selected, setSelected] = useState<string | null>(null);
  const [numericValue, setNumericValue] = useState('');
  const [draft, setDraft] = useState('');
  const [checkedCriteria, setCheckedCriteria] = useState<boolean[]>([]);
  const promptLang = isChineseTopic(question.topic) || question.topic === 'chinese-writing-studio' || lang === 'zh' ? 'zh-Hans' : 'en';
  const answerLang = isChineseTopic(question.topic) ? 'zh-Hans' : isEnglishTopic(question.topic) ? 'en' : promptLang;
  const responseLang = question.topic === 'chinese-writing-studio' ? 'zh-Hans' : question.topic === 'english-writing-studio' ? 'en' : promptLang;

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

  // `skipped` lets a learner who is stuck move on: they still see the example
  // and rubric, and the item stays unscored either way.
  function revealReview(skipped = false) {
    if ((!skipped && !draft.trim()) || !question.selfReview) return;
    setCheckedCriteria(new Array(question.selfReview.criteria.length).fill(false));
    setFeedback('review');
  }

  function completeReview() {
    onAnswer(draft.trim(), false);
    setFeedback('complete');
  }

  return (
    <div className={`question-card ${feedback === 'correct' ? 'edu-bounce' : ''} ${feedback === 'wrong' ? 'edu-shake' : ''}`}>
      <p className="question-card__prompt" lang={promptLang}>{t(question.prompt, lang)}</p>
      {question.visual && <QuestionVisual visual={question.visual} lang={lang} />}

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

      {question.kind === 'self-check' && question.selfReview && feedback === 'none' && (
        <div className="question-card__draft">
          <label htmlFor={`draft-${question.id}`}>{lang === 'zh' ? '先写下你的答案。' : 'Write your answer first.'}</label>
          <textarea id={`draft-${question.id}`} value={draft} onChange={(event) => setDraft(event.target.value)} rows={7} maxLength={900} />
          <small>{draft.length}/900</small>
          <button type="button" className="question-card__review-button" disabled={!draft.trim()} onClick={() => { playButtonTap(); revealReview(); }}>{lang === 'zh' ? '查看示例与检查表' : 'Reveal example and checklist'}</button>
          <button type="button" className="question-card__skip" onClick={() => { playButtonTap(); revealReview(true); }}>{lang === 'zh' ? '这题先跳过，看看示例' : 'Skip this one and see the example'}</button>
        </div>
      )}

      {question.kind === 'self-check' && question.selfReview && feedback === 'review' && (
        <div className="question-card__self-review" role="region" aria-label={lang === 'zh' ? '自我检查' : 'Self-check'}>
          <p className="question-card__model-label">{lang === 'zh' ? '示例答案（你的答案可以不同）' : 'Example response (your answer may be different)'}</p>
          <p className="question-card__model" lang={responseLang}>{t(question.selfReview.modelAnswer, lang)}</p>
          <fieldset><legend>{lang === 'zh' ? '对照自己的答案逐项检查；没做到的项目可以不勾选：' : 'Check your response; leave anything you have not met unticked:'}</legend>{question.selfReview.criteria.map((criterion, index) => <label key={criterion.en}><input type="checkbox" checked={checkedCriteria[index] ?? false} onChange={() => setCheckedCriteria((values) => values.map((value, item) => item === index ? !value : value))} /> <span lang={responseLang}>{t(criterion, lang)}</span></label>)}</fieldset>
          <p className="question-card__unscored">{lang === 'zh' ? '这是自我检查，不会计入分数。' : 'This is a self-check and does not affect your score.'}</p>
          <button type="button" className="question-card__review-button" onClick={() => { playButtonTap(); completeReview(); }}>{lang === 'zh' ? '完成自我检查' : 'Complete self-check'}</button>
        </div>
      )}

      {question.kind === 'self-check' && feedback === 'complete' && (
        <div className="question-card__self-complete" role="status">
          <p>✓ {lang === 'zh' ? '自我检查已完成（不计分）' : 'Self-check complete (unscored)'}</p>
          <button type="button" className="question-card__next" onClick={() => { playButtonTap(); onNext(); }}>{nextLabel} <span aria-hidden="true">→</span></button>
        </div>
      )}

      {feedback !== 'none' && feedback !== 'review' && feedback !== 'complete' && (
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
