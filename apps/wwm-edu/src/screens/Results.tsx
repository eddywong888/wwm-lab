import { useEffect } from 'react';
import './Results.css';
import type { AnswerRecord, Lang } from '../engine/types';
import { t, UI_STRINGS } from '../engine/i18n';
import { playSessionFanfare, playBadgeUnlock } from '../audio/sfx';
import type { EarnedBadge } from '../engine/badges';
import type { ReviewSkillProgress } from '../store/local';
import { topicDetails } from '../engine/topic-meta';
import { isChineseTopic, isEnglishTopic } from '../engine/english';

interface ResultsProps {
  lang: Lang;
  correctCount: number;
  totalCount: number;
  bestStreak: number;
  newBadges: EarnedBadge[];
  answers: AnswerRecord[];
  weakAreas: ReviewSkillProgress[];
  isReview: boolean;
  onPracticeWeakAreas: () => void;
  onRetry: () => void;
  onBackHome: () => void;
}

const TIER_LABEL_KEY = {
  bronze: 'badgeTierBronze',
  silver: 'badgeTierSilver',
  gold: 'badgeTierGold',
} as const;

function starsFor(correctCount: number, totalCount: number = 10): number {
  if (totalCount <= 0) return 0;
  const ratio = correctCount / totalCount;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

function encouragement(stars: number) {
  if (stars >= 3) return UI_STRINGS.encourageGreat;
  if (stars >= 2) return UI_STRINGS.encourageGood;
  if (stars >= 1) return UI_STRINGS.encourageOk;
  return UI_STRINGS.encourageTryAgain;
}

export default function Results({ lang, correctCount, totalCount, bestStreak, newBadges, answers, weakAreas, isReview, onPracticeWeakAreas, onRetry, onBackHome }: ResultsProps) {
  const stars = starsFor(correctCount, totalCount);
  const mistakes = answers.filter((answer) => answer.scored !== false && !answer.correct);
  const selfChecks = answers.filter((answer) => answer.scored === false);

  useEffect(() => {
    playSessionFanfare();
    if (newBadges.length > 0) {
      const timer = setTimeout(() => playBadgeUnlock(), 550);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="results">
      <div className="results__card edu-pop-in">
        <div className="results__mascot" aria-hidden="true">🦉</div>
        <h1 className="results__encourage">{t(encouragement(stars), lang)}</h1>
        <p className="results__label">{t(UI_STRINGS.yourScore, lang)}</p>

        <div className="results__stars" aria-label={`${stars} stars`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`results__star ${i < stars ? 'results__star--filled' : ''}`}>★</span>
          ))}
        </div>

        <div className="results__summary">
          <div className="results__summary-item">
            <strong>{correctCount}/{totalCount}</strong>
            <span>{t(UI_STRINGS.yourScore, lang)}</span>
          </div>
          <div className="results__summary-item">
            <strong>🔥 {bestStreak}</strong>
            <span>{t(UI_STRINGS.bestStreak, lang)}</span>
          </div>
          <div className="results__summary-item">
            <strong>⭐ {stars}</strong>
            <span>{t(UI_STRINGS.stars, lang)}</span>
          </div>
        </div>

        {selfChecks.length > 0 && <p className="results__self-check">📝 {lang === 'zh' ? `已完成 ${selfChecks.length} 项自我检查；这些项目不计分。` : `${selfChecks.length} self-checks completed; these are not scored.`}</p>}

        {selfChecks.length > 0 && (
          <section className="results__writing">
            <div className="results__section-head">
              <span aria-hidden="true">📝</span>
              <div>
                <h2>{lang === 'zh' ? '你写的内容' : 'What you wrote'}</h2>
                <p>{lang === 'zh' ? '和示例比一比；这些内容不计分，也不会上传。' : 'Compare it with the example — unscored, and never uploaded.'}</p>
              </div>
            </div>
            <div className="results__writing-list">
              {selfChecks.map((answer, index) => {
                const responseLang = answer.question.topic === 'chinese-writing-studio' ? 'zh-Hans' : answer.question.topic === 'english-writing-studio' ? 'en' : lang === 'zh' ? 'zh-Hans' : 'en';
                return (
                  <article className="results__writing-item" key={`${answer.question.id}-${index}`}>
                    <p className="results__writing-prompt" lang={responseLang}>{t(answer.question.prompt, lang)}</p>
                    <dl>
                      <div>
                        <dt>{t(UI_STRINGS.yourAnswer, lang)}</dt>
                        <dd lang={responseLang}>{answer.givenAnswer || (lang === 'zh' ? '（已跳过）' : '(skipped)')}</dd>
                      </div>
                      {answer.question.selfReview && (
                        <div>
                          <dt>{lang === 'zh' ? '示例答案' : 'Example response'}</dt>
                          <dd lang={responseLang}>{t(answer.question.selfReview.modelAnswer, lang)}</dd>
                        </div>
                      )}
                    </dl>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {newBadges.length > 0 && (
          <div className="results__badges edu-pop-in">
            <p className="results__badges-title">🎉 {t(UI_STRINGS.newBadgeUnlocked, lang)}</p>
            <div className="results__badges-list">
              {newBadges.map((b) => (
                <div key={b.def.id} className={`results__badge results__badge--${b.tier}`}>
                  <span className="results__badge-icon" aria-hidden="true">{b.def.icon}</span>
                  <span className="results__badge-name">{t(b.def.name, lang)}</span>
                  <span className="results__badge-tier">{b.tier ? t(UI_STRINGS[TIER_LABEL_KEY[b.tier]], lang) : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mistakes.length > 0 && (
          <section className="results__mistakes">
            <div className="results__section-head">
              <span aria-hidden="true">🧩</span>
              <div>
                <h2>{t(UI_STRINGS.reviewMistakes, lang)}</h2>
                <p>{t(UI_STRINGS.reviewMistakesHint, lang)}</p>
              </div>
            </div>
            <div className="results__mistake-list">
              {mistakes.map((answer, index) => (
                <article className="results__mistake" key={`${answer.question.id}-${index}`}>
                  <p className="results__mistake-topic">{t(topicDetails(answer.question.topic).name, lang)}</p>
                  <p className="results__mistake-prompt" lang={isChineseTopic(answer.question.topic) || lang === 'zh' ? 'zh-Hans' : 'en'}>{t(answer.question.prompt, lang)}</p>
                  <dl>
                    <div>
                      <dt>{t(UI_STRINGS.yourAnswer, lang)}</dt>
                      <dd lang={isChineseTopic(answer.question.topic) ? 'zh-Hans' : isEnglishTopic(answer.question.topic) ? 'en' : undefined}>{answer.givenAnswer || '—'}</dd>
                    </div>
                    <div>
                      <dt>{t(UI_STRINGS.correctAnswerWas, lang)}</dt>
                      <dd lang={isChineseTopic(answer.question.topic) ? 'zh-Hans' : isEnglishTopic(answer.question.topic) ? 'en' : undefined}>{answer.question.answer}</dd>
                    </div>
                  </dl>
                  {answer.question.explain && <p className="results__mistake-explain" lang={isChineseTopic(answer.question.topic) || lang === 'zh' ? 'zh-Hans' : 'en'}>💡 {t(answer.question.explain, lang)}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {weakAreas.length > 0 && (
          <section className="results__recommendation">
            <div>
              <strong>🧠 {t(UI_STRINGS.recommendedNext, lang)}</strong>
              <p>{weakAreas.slice(0, 3).map((skill) => `${t(topicDetails(skill.topicId).name, lang)} · ${t(UI_STRINGS[skill.difficulty], lang)}`).join(' • ')}</p>
            </div>
            <span>{weakAreas.length}</span>
          </section>
        )}

        <div className="results__actions">
          {weakAreas.length > 0 && (
            <button type="button" className="results__btn results__btn--primary" onClick={onPracticeWeakAreas}>
              {t(UI_STRINGS.practiceWeakAreas, lang)}
            </button>
          )}
          {!isReview && (
            <button type="button" className={`results__btn ${weakAreas.length === 0 ? 'results__btn--primary' : ''}`} onClick={onRetry}>
              {t(UI_STRINGS.retrySameTopic, lang)}
            </button>
          )}
          <button type="button" className="results__btn" onClick={onBackHome}>
            {t(UI_STRINGS.backHome, lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
