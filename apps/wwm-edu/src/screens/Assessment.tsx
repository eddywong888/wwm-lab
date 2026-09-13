import { useEffect, useMemo, useRef, useState } from 'react';
import './Assessment.css';
import type { AnswerRecord, Difficulty, Lang, Subject } from '../engine/types';
import { generateAssessmentPaper, markAssessment } from '../engine/assessment';
import { t } from '../engine/i18n';
import { topicDetails } from '../engine/topic-meta';
import { isChineseTopic, isEnglishTopic } from '../engine/english';
import QuestionVisual from '../components/QuestionVisual';
import { playButtonTap } from '../audio/sfx';

interface AssessmentProps {
  subject: Subject;
  difficulty: Difficulty;
  lang: Lang;
  sessionKey: number;
  excludeIds: readonly string[];
  onFinish: (answers: AnswerRecord[], bestStreak: number) => void;
  onBackHome: () => void;
}

const SUBJECT_NAME = {
  math: { en: 'Mathematics', zh: '数学' },
  english: { en: 'English', zh: '英语' },
  chinese: { en: 'Chinese', zh: '华文' },
};

export default function Assessment({ subject, difficulty, lang, sessionKey, excludeIds, onFinish, onBackHome }: AssessmentProps) {
  const [seed] = useState(() => Date.now());
  const questions = useMemo(
    () => generateAssessmentPaper(subject, difficulty, `${seed}-${sessionKey}`, excludeIds),
    [subject, difficulty, seed, sessionKey, excludeIds],
  );
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>(() => new Array(questions.length).fill(''));
  const [reviewingSubmit, setReviewingSubmit] = useState(false);
  const [confirmingExit, setConfirmingExit] = useState(false);
  const promptRef = useRef<HTMLHeadingElement>(null);
  const current = questions[index];
  const answeredCount = responses.filter((answer) => answer.trim()).length;
  const unansweredCount = questions.length - answeredCount;
  const promptLang = isChineseTopic(current.topic) || lang === 'zh' ? 'zh-Hans' : 'en';
  const answerLang = isChineseTopic(current.topic) ? 'zh-Hans' : isEnglishTopic(current.topic) ? 'en' : promptLang;

  useEffect(() => {
    promptRef.current?.focus();
  }, [index]);

  function setResponse(value: string) {
    setResponses((currentResponses) => currentResponses.map((response, item) => item === index ? value : response));
  }

  function goTo(next: number) {
    playButtonTap();
    setReviewingSubmit(false);
    setIndex(next);
  }

  function submitPaper() {
    const result = markAssessment(questions, responses, difficulty);
    onFinish(result.answers, result.bestStreak);
  }

  function requestExit() {
    playButtonTap();
    if (answeredCount === 0) onBackHome();
    else setConfirmingExit(true);
  }

  return (
    <div className="assessment">
      <header className="assessment__header">
        <button type="button" className="assessment__back" onClick={requestExit} aria-label={lang === 'zh' ? '离开评估练习' : 'Leave assessment practice'}>←</button>
        <div>
          <p>{lang === 'zh' ? '学习评估练习' : 'Assessment Practice'}</p>
          <h1>{t(SUBJECT_NAME[subject], lang)} · {lang === 'zh' ? (difficulty === 'standard' ? '标准' : '挑战') : (difficulty === 'standard' ? 'Standard' : 'Advanced')}</h1>
        </div>
        <span>{answeredCount}/{questions.length}</span>
      </header>

      <main className="assessment__workspace">
        <aside className="assessment__navigator" aria-label={lang === 'zh' ? '题目导航' : 'Question navigator'}>
          <p>{lang === 'zh' ? '题目' : 'Questions'}</p>
          <div>
            {questions.map((question, item) => (
              <button
                type="button"
                key={question.id}
                className={`${item === index ? 'assessment__nav-item--current' : ''} ${responses[item]?.trim() ? 'assessment__nav-item--answered' : ''}`}
                aria-current={item === index ? 'step' : undefined}
                aria-label={`${lang === 'zh' ? '第' : 'Question'} ${item + 1}${responses[item]?.trim() ? (lang === 'zh' ? '，已作答' : ', answered') : ''}`}
                onClick={() => goTo(item)}
              >{item + 1}</button>
            ))}
          </div>
          <small>{lang === 'zh' ? '紫点表示已作答。提交前不会显示答案。' : 'Purple dots are answered. Answers stay hidden until submission.'}</small>
        </aside>

        <section className="assessment__paper">
          <div className="assessment__question-meta">
            <span>{topicDetails(current.topic).icon} {t(topicDetails(current.topic).name, lang)}</span>
            <strong>{lang === 'zh' ? `第 ${index + 1} 题，共 ${questions.length} 题` : `Question ${index + 1} of ${questions.length}`}</strong>
          </div>
          <div className="assessment__question">
            <h2 className="assessment__prompt" lang={promptLang} ref={promptRef} tabIndex={-1}>{t(current.prompt, lang)}</h2>
            {current.visual && <QuestionVisual visual={current.visual} lang={lang} />}
            {current.kind === 'mcq' && current.choices && (
              <div className="assessment__choices">
                {current.choices.map((choice, choiceIndex) => (
                  <button
                    type="button"
                    key={choice}
                    aria-pressed={responses[index] === choice}
                    onClick={() => { playButtonTap(); setResponse(choice); }}
                  >
                    <span aria-hidden="true">{String.fromCharCode(65 + choiceIndex)}</span>
                    <strong lang={answerLang}>{choice}</strong>
                  </button>
                ))}
              </div>
            )}
            {current.kind === 'numeric' && (
              <label className="assessment__numeric">
                <span>{lang === 'zh' ? '输入答案' : 'Enter your answer'}</span>
                <input inputMode="decimal" value={responses[index]} onChange={(event) => setResponse(event.target.value.replace(/[^0-9.-]/g, ''))} />
              </label>
            )}
          </div>

          {reviewingSubmit && (
            <div className="assessment__submit-review" role="status">
              <strong>{unansweredCount === 0
                ? (lang === 'zh' ? '全部题目已作答。准备提交吗？' : 'Every question is answered. Ready to submit?')
                : (lang === 'zh' ? `还有 ${unansweredCount} 题未作答。空白题会算作答错。` : `${unansweredCount} questions are unanswered. Blank answers will be marked wrong.`)}</strong>
              <div>
                <button type="button" onClick={() => setReviewingSubmit(false)}>{lang === 'zh' ? '继续检查' : 'Keep checking'}</button>
                <button type="button" className="assessment__submit-final" onClick={() => { playButtonTap(); submitPaper(); }}>{lang === 'zh' ? '提交评估' : 'Submit assessment'}</button>
              </div>
            </div>
          )}

          <div className="assessment__actions">
            <button type="button" disabled={index === 0} onClick={() => goTo(index - 1)}>← {lang === 'zh' ? '上一题' : 'Previous'}</button>
            {index + 1 < questions.length
              ? <button type="button" className="assessment__primary" onClick={() => goTo(index + 1)}>{lang === 'zh' ? '下一题' : 'Next'} →</button>
              : <button type="button" className="assessment__primary" onClick={() => { playButtonTap(); setReviewingSubmit(true); }}>{lang === 'zh' ? '检查并提交' : 'Review & submit'}</button>}
          </div>
        </section>
      </main>

      {confirmingExit && (
        <div className="assessment__exit-layer" role="presentation">
          <div className="assessment__exit-dialog" role="dialog" aria-modal="true" aria-labelledby="assessment-exit-title">
            <h2 id="assessment-exit-title">{lang === 'zh' ? '离开这份评估吗？' : 'Leave this assessment?'}</h2>
            <p>{lang === 'zh' ? '目前的作答不会保存。' : 'Your answers in this paper will not be saved.'}</p>
            <div>
              <button type="button" onClick={() => setConfirmingExit(false)}>{lang === 'zh' ? '继续作答' : 'Keep working'}</button>
              <button type="button" className="assessment__exit-confirm" onClick={onBackHome}>{lang === 'zh' ? '离开评估' : 'Leave assessment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
