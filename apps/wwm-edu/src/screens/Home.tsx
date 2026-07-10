import './Home.css';
import type { Difficulty, Lang } from '../engine/types';
import { MATH_GENERATORS } from '../engine/math';
import { MIXED_TOPIC_ID } from '../engine/session';
import { t, UI_STRINGS } from '../engine/i18n';
import TopicCard from '../components/TopicCard';
import type { EduState } from '../store/local';
import { playButtonTap, toggleMuted } from '../audio/sfx';

interface HomeProps {
  state: EduState;
  onChangeLang: (lang: Lang) => void;
  onChangeDifficulty: (difficulty: Difficulty) => void;
  onSelectTopic: (topicId: string) => void;
  onMuteChange: (muted: boolean) => void;
}

export default function Home({ state, onChangeLang, onChangeDifficulty, onSelectTopic, onMuteChange }: HomeProps) {
  const { lang, difficulty, perTopic, muted } = state;

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
          <button type="button" className="home__lang-toggle" onClick={() => { playButtonTap(); onChangeLang(lang === 'en' ? 'zh' : 'en'); }}>
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          <button type="button" className="home__mute-toggle" onClick={handleToggleMute} aria-label={muted ? t(UI_STRINGS.mute, lang) : t(UI_STRINGS.unmute, lang)}>
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

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

      <div className="home__grid">
        <TopicCard
          icon="🎲"
          name={UI_STRINGS.mixedPractice}
          bestStreak={perTopic[MIXED_TOPIC_ID]?.bestStreak ?? 0}
          onClick={() => onSelectTopic(MIXED_TOPIC_ID)}
          lang={lang}
          accent="mixed"
        />
        {MATH_GENERATORS.map((g) => (
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
    </div>
  );
}
