import './Badges.css';
import type { Lang } from '../engine/types';
import type { EduState } from '../store/local';
import { BADGES, computeDailyStreak, computeEarnedBadgeIds } from '../engine/badges';
import { t, UI_STRINGS } from '../engine/i18n';

interface BadgesProps {
  lang: Lang;
  state: EduState;
  onBackHome: () => void;
}

export default function Badges({ lang, state, onBackHome }: BadgesProps) {
  const earned = computeEarnedBadgeIds(state);
  const dailyStreak = computeDailyStreak(state.dailyResults);

  return (
    <div className="badges-screen">
      <div className="badges-screen__card edu-pop-in">
        <button type="button" className="badges-screen__back" onClick={onBackHome}>
          ← {t(UI_STRINGS.backHome, lang)}
        </button>
        <h1 className="badges-screen__title">🎖️ {t(UI_STRINGS.badges, lang)}</h1>
        <p className="badges-screen__subtitle">
          {earned.size} / {BADGES.length} {t(UI_STRINGS.badgesEarned, lang)}
          {dailyStreak.current > 0 && ` · 🔥 ${dailyStreak.current} ${t(UI_STRINGS.dailyStreakLabel, lang)}`}
        </p>

        <div className="badges-screen__grid">
          {BADGES.map((badge) => {
            const isEarned = earned.has(badge.id);
            return (
              <div key={badge.id} className={`badge-tile ${isEarned ? 'badge-tile--earned' : 'badge-tile--locked'}`}>
                <span className="badge-tile__icon" aria-hidden="true">{isEarned ? badge.icon : '🔒'}</span>
                <span className="badge-tile__name">{t(badge.name, lang)}</span>
                <span className="badge-tile__desc">{t(badge.description, lang)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
