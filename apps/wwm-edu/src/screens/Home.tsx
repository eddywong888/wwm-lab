import { useState } from 'react';
import './Home.css';
import type { Difficulty, Lang } from '../engine/types';
import { MATH_GENERATORS } from '../engine/math';
import { ENGLISH_TOPICS } from '../engine/english';
import { DAILY_TOPIC_ID, MIXED_TOPIC_ID, QUESTIONS_PER_SESSION, todayDateString } from '../engine/session';
import { t, UI_STRINGS } from '../engine/i18n';
import TopicCard from '../components/TopicCard';
import AccountModal from '../components/AccountModal';
import type { EduState } from '../store/local';
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
}

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
}: HomeProps) {
  const { lang, difficulty, perTopic, muted, account } = state;
  const [showAccountModal, setShowAccountModal] = useState(false);
  const termOneGenerators = MATH_GENERATORS.filter((g) => g.meta.term !== 2);
  const termTwoGenerators = MATH_GENERATORS.filter((g) => g.meta.term === 2);
  const today = todayDateString();
  const todayResult = state.dailyResults?.[today];

  function handleToggleMute() {
    const next = toggleMuted();
    onMuteChange(next);
  }

  return (
    <div className="home">
      <header className="home__header">
        <div className="home__brand">
          <span className="home__mascot" aria-hidden="true">🦉</span>
          <div>
            <h1 className="home__title">{t(UI_STRINGS.appTitle, lang)}</h1>
            <p className="home__tagline">{t(UI_STRINGS.tagline, lang)}</p>
          </div>
        </div>
        <div className="home__controls">
          <button
            type="button"
            className="home__profile-toggle"
            onClick={() => { playButtonTap(); setShowAccountModal(true); }}
            aria-label={t(UI_STRINGS.profile, lang)}
          >
            {account ? `👤 ${account.nickname}` : '👤'}
          </button>
          <button
            type="button"
            className="home__trophy-toggle"
            onClick={() => { playButtonTap(); onOpenLeaderboard(); }}
            aria-label={t(UI_STRINGS.leaderboard, lang)}
          >
            🏆
          </button>
          <button type="button" className="home__lang-toggle" onClick={() => { playButtonTap(); onChangeLang(lang === 'en' ? 'zh' : 'en'); }}>
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          <button type="button" className="home__mute-toggle" onClick={handleToggleMute} aria-label={muted ? t(UI_STRINGS.mute, lang) : t(UI_STRINGS.unmute, lang)}>
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

      <div className="home__difficulty">
        <button
          type="button"
          className={`home__difficulty-btn ${difficulty === 'standard' ? 'home__difficulty-btn--active' : ''}`}
          onClick={() => { playButtonTap(); onChangeDifficulty('standard'); }}
        >
          {t(UI_STRINGS.standard, lang)}
        </button>
        <button
          type="button"
          className={`home__difficulty-btn ${difficulty === 'advanced' ? 'home__difficulty-btn--active' : ''}`}
          onClick={() => { playButtonTap(); onChangeDifficulty('advanced'); }}
        >
          {t(UI_STRINGS.advanced, lang)}
        </button>
      </div>

      <button type="button" className="home__daily-card" onClick={() => { playButtonTap(); onSelectTopic(DAILY_TOPIC_ID); }}>
        <div className="home__daily-top">
          <span className="home__daily-icon" aria-hidden="true">🗓️</span>
          <div>
            <p className="home__daily-title">{t(UI_STRINGS.dailyChallenge, lang)}</p>
            <p className="home__daily-date">{today}</p>
          </div>
        </div>
        {todayResult ? (
          <p className="home__daily-status">
            {t(UI_STRINGS.playedToday, lang)}: {todayResult.score}/{QUESTIONS_PER_SESSION} {'⭐'.repeat(starsForScore(todayResult.score))}
          </p>
        ) : (
          <p className="home__daily-status home__daily-status--cta">{t(UI_STRINGS.start, lang)} →</p>
        )}
      </button>

      <div className="home__grid home__grid--mixed">
        <TopicCard
          icon="🎲"
          name={UI_STRINGS.mixedPractice}
          bestStreak={perTopic[MIXED_TOPIC_ID]?.bestStreak ?? 0}
          onClick={() => onSelectTopic(MIXED_TOPIC_ID)}
          lang={lang}
          accent="mixed"
        />
      </div>

      <h2 className="home__section-heading">
        {UI_STRINGS.termOne.en} / {UI_STRINGS.termOne.zh}
      </h2>
      <div className="home__grid">
        {termOneGenerators.map((g) => (
          <TopicCard
            key={g.meta.id}
            icon={g.meta.icon}
            name={g.meta.name}
            bestStreak={perTopic[g.meta.id]?.bestStreak ?? 0}
            onClick={() => onSelectTopic(g.meta.id)}
            lang={lang}
          />
        ))}
      </div>

      <h2 className="home__section-heading">
        {UI_STRINGS.termTwo.en} / {UI_STRINGS.termTwo.zh}
      </h2>
      <div className="home__grid">
        {termTwoGenerators.map((g) => (
          <TopicCard
            key={g.meta.id}
            icon={g.meta.icon}
            name={g.meta.name}
            bestStreak={perTopic[g.meta.id]?.bestStreak ?? 0}
            onClick={() => onSelectTopic(g.meta.id)}
            lang={lang}
          />
        ))}
      </div>

      <h2 className="home__section-heading">
        {UI_STRINGS.englishSection.en} / {UI_STRINGS.englishSection.zh}
      </h2>
      <div className="home__grid">
        {ENGLISH_TOPICS.map((g) => (
          <TopicCard
            key={g.id}
            icon={g.icon}
            name={g.name}
            bestStreak={perTopic[g.id]?.bestStreak ?? 0}
            onClick={() => onSelectTopic(g.id)}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}
