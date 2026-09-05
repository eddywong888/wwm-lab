import { useState } from 'react';
import './Home.css';
import type { Difficulty, Lang } from '../engine/types';
import { MATH_GENERATORS } from '../engine/math';
import { ENGLISH_TOPICS, CHINESE_TOPICS } from '../engine/english';
import { DAILY_TOPIC_ID, MIXED_TOPIC_ID, QUESTIONS_PER_SESSION, todayDateString } from '../engine/session';
import { t, UI_STRINGS } from '../engine/i18n';
import TopicCard from '../components/TopicCard';
import AccountModal from '../components/AccountModal';
import BadgeShelf from '../components/BadgeShelf';
import type { EduState } from '../store/local';
import { computeBadges } from '../engine/badges';
import { playButtonTap, toggleMuted } from '../audio/sfx';

interface HomeProps {
  state: EduState;
  onChangeLang: (lang: Lang) => void;
  onChangeDifficulty: (difficulty: Difficulty) => void;
  onSelectTopic: (topicId: string) => void;
  onMuteChange: (muted: boolean) => void;
  onSignIn: (nickname: string, pin: string) => Promise<void>;
  onSignOut: () => void;
  onOpenLeaderboard: () => void;
  onOpenBadges: () => void;
}

type Subject = 'math' | 'english' | 'chinese';

function starsForScore(score: number): number {
  if (score >= 9) return 3;
  if (score >= 7) return 2;
  if (score >= 5) return 1;
  return 0;
}

export default function Home({
  state,
  onChangeLang,
  onChangeDifficulty,
  onSelectTopic,
  onMuteChange,
  onSignIn,
  onSignOut,
  onOpenLeaderboard,
  onOpenBadges,
}: HomeProps) {
  const { lang, difficulty, perTopic, muted, account } = state;
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [subject, setSubject] = useState<Subject>('math');
  const termOneGenerators = MATH_GENERATORS.filter((generator) => generator.meta.term !== 2);
  const termTwoGenerators = MATH_GENERATORS.filter((generator) => generator.meta.term === 2);
  const today = todayDateString();
  const todayResult = state.dailyResults?.[today];
  const earnedBadges = computeBadges(state).filter((badge) => badge.tier !== null).length;

  function handleToggleMute() {
    const next = toggleMuted();
    onMuteChange(next);
  }

  function chooseSubject(next: Subject) {
    playButtonTap();
    setSubject(next);
  }

  return (
    <div className="home">
      <header className="home__header">
        <div className="home__brand">
          <a className="home__site-back" href="/" aria-label={t(UI_STRINGS.backToLab, lang)} title={t(UI_STRINGS.backToLab, lang)}>←</a>
          <span className="home__mascot" aria-hidden="true">🦉</span>
          <div>
            <h1 className="home__title">{t(UI_STRINGS.appTitle, lang)}</h1>
            <p className="home__tagline">{t(UI_STRINGS.tagline, lang)}</p>
          </div>
        </div>

        <button
          type="button"
          className="home__profile-toggle"
          onClick={() => { playButtonTap(); setShowAccountModal(true); }}
          aria-label={t(UI_STRINGS.profile, lang)}
        >
          <span className="home__profile-avatar" aria-hidden="true">{account ? account.nickname.charAt(0).toUpperCase() : '👤'}</span>
          <span className="home__profile-copy">
            <strong>{account?.nickname ?? t(UI_STRINGS.profile, lang)}</strong>
            <small>{earnedBadges} {t(UI_STRINGS.badgeShelfCount, lang)}</small>
          </span>
        </button>

        <div className="home__controls">
          <button type="button" className="home__icon-toggle" onClick={() => { playButtonTap(); onOpenLeaderboard(); }} aria-label={t(UI_STRINGS.leaderboard, lang)}>🏆</button>
          <button type="button" className="home__icon-toggle" onClick={() => { playButtonTap(); onOpenBadges(); }} aria-label={t(UI_STRINGS.badges, lang)}>🏅</button>
          <button type="button" className="home__icon-toggle home__lang-toggle" onClick={() => { playButtonTap(); onChangeLang(lang === 'en' ? 'zh' : 'en'); }} aria-label={lang === 'en' ? '切换到中文' : 'Switch to English'}>
            {lang === 'en' ? '中' : 'EN'}
          </button>
          <button type="button" className="home__icon-toggle" onClick={handleToggleMute} aria-label={muted ? t(UI_STRINGS.mute, lang) : t(UI_STRINGS.unmute, lang)}>
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {showAccountModal && (
        <AccountModal
          lang={lang}
          account={account}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onClose={() => setShowAccountModal(false)}
        />
      )}

      <main className="home__main">
        <section className="home__welcome">
          <p className="home__eyebrow">✨ {t(UI_STRINGS.learningSpace, lang)}</p>
          <h2>{t(UI_STRINGS.welcomeTitle, lang)}</h2>
          <p className="home__welcome-copy">{t(UI_STRINGS.welcomeBody, lang)}</p>
          <button type="button" className="home__welcome-action" onClick={() => { playButtonTap(); onSelectTopic(MIXED_TOPIC_ID); }}>
            🎲 {t(UI_STRINGS.mixedPractice, lang)} <span aria-hidden="true">→</span>
          </button>
          <span className="home__welcome-orbit" aria-hidden="true">★</span>
        </section>

        <div className="home__quick-stack">
          <button type="button" className="home__daily-card" onClick={() => { playButtonTap(); onSelectTopic(DAILY_TOPIC_ID); }}>
            <span className={`home__daily-ring ${todayResult ? 'home__daily-ring--done' : ''}`} aria-hidden="true"><span>🗓️</span></span>
            <span className="home__daily-copy">
              <small>{today}</small>
              <strong>{t(UI_STRINGS.dailyChallenge, lang)}</strong>
              <span className="home__daily-status">
                {todayResult
                  ? `${t(UI_STRINGS.playedToday, lang)}: ${todayResult.score}/${QUESTIONS_PER_SESSION} ${'⭐'.repeat(starsForScore(todayResult.score))}`
                  : `${QUESTIONS_PER_SESSION} ${t(UI_STRINGS.questionsToday, lang)} · ${t(UI_STRINGS.start, lang)} →`}
              </span>
            </span>
          </button>

          <BadgeShelf lang={lang} state={state} onOpenBadges={onOpenBadges} />
        </div>

        <section className="home__topics">
          <div className="home__topics-head">
            <div>
              <p className="home__eyebrow home__eyebrow--ink">{t(UI_STRINGS.practiceByTopic, lang)}</p>
              <h2>{t(UI_STRINGS.chooseTopic, lang)}</h2>
            </div>
            <div className="home__difficulty" role="group" aria-label={t(UI_STRINGS.difficulty, lang)}>
              <button type="button" aria-pressed={difficulty === 'standard'} onClick={() => { playButtonTap(); onChangeDifficulty('standard'); }}>
                {t(UI_STRINGS.standard, lang)}
              </button>
              <button type="button" aria-pressed={difficulty === 'advanced'} onClick={() => { playButtonTap(); onChangeDifficulty('advanced'); }}>
                {t(UI_STRINGS.advanced, lang)}
              </button>
            </div>
          </div>

          <div className="home__subject-tabs" role="group" aria-label={t(UI_STRINGS.subject, lang)}>
            <button type="button" aria-pressed={subject === 'math'} onClick={() => chooseSubject('math')}>🔢 {t(UI_STRINGS.math, lang)}</button>
            <button type="button" aria-pressed={subject === 'english'} onClick={() => chooseSubject('english')}>📚 {t(UI_STRINGS.englishSection, lang)}</button>
            <button type="button" aria-pressed={subject === 'chinese'} onClick={() => chooseSubject('chinese')}>📙 {t(UI_STRINGS.chineseSection, lang)}</button>
          </div>

          {subject === 'math' ? (
            <div className="home__subject-panel edu-pop-in" key="math">
              <h3 className="home__section-heading">{t(UI_STRINGS.termOne, lang)}</h3>
              <div className="home__grid">
                {termOneGenerators.map((generator) => (
                  <TopicCard
                    key={generator.meta.id}
                    icon={generator.meta.icon}
                    name={generator.meta.name}
                    bestStreak={perTopic[generator.meta.id]?.bestStreak ?? 0}
                    stars={perTopic[generator.meta.id]?.stars ?? 0}
                    onClick={() => onSelectTopic(generator.meta.id)}
                    lang={lang}
                  />
                ))}
              </div>

              <h3 className="home__section-heading">{t(UI_STRINGS.termTwo, lang)}</h3>
              <div className="home__grid">
                {termTwoGenerators.map((generator) => (
                  <TopicCard
                    key={generator.meta.id}
                    icon={generator.meta.icon}
                    name={generator.meta.name}
                    bestStreak={perTopic[generator.meta.id]?.bestStreak ?? 0}
                    stars={perTopic[generator.meta.id]?.stars ?? 0}
                    onClick={() => onSelectTopic(generator.meta.id)}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="home__subject-panel edu-pop-in" key={subject}>
              <div className="home__grid">
                {(subject === 'chinese' ? CHINESE_TOPICS : ENGLISH_TOPICS).map((topic) => (
                  <TopicCard
                    key={topic.id}
                    icon={topic.icon}
                    name={topic.name}
                    bestStreak={perTopic[topic.id]?.bestStreak ?? 0}
                    stars={perTopic[topic.id]?.stars ?? 0}
                    onClick={() => onSelectTopic(topic.id)}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
