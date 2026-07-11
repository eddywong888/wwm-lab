import { useEffect } from 'react';
import './Results.css';
import type { Lang } from '../engine/types';
import { t, UI_STRINGS } from '../engine/i18n';
import { playSessionFanfare, playBadgeUnlock } from '../audio/sfx';
import type { BadgeDef } from '../engine/badges';
import Mascot, { type MascotMood } from '../components/Mascot';

interface ResultsProps {
  lang: Lang;
  correctCount: number;
  totalCount: number;
  bestStreak: number;
  newBadges: BadgeDef[];
  onRetry: () => void;
  onBackHome: () => void;
}

function starsFor(correctCount: number): number {
  if (correctCount >= 9) return 3;
  if (correctCount >= 7) return 2;
  if (correctCount >= 5) return 1;
  return 0;
}

function encouragement(stars: number) {
  if (stars >= 3) return UI_STRINGS.encourageGreat;
  if (stars >= 2) return UI_STRINGS.encourageGood;
  if (stars >= 1) return UI_STRINGS.encourageOk;
  return UI_STRINGS.encourageTryAgain;
}

function moodForStars(stars: number): MascotMood {
  if (stars >= 3) return 'celebrate';
  if (stars >= 1) return 'happy';
  return 'sad';
}

export default function Results({ lang, correctCount, totalCount, bestStreak, newBadges, onRetry, onBackHome }: ResultsProps) {
  const stars = starsFor(correctCount);

  useEffect(() => {
    playSessionFanfare();
    if (newBadges.length > 0) {
      const timer = setTimeout(playBadgeUnlock, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="results">
      <div className="results__card edu-pop-in">
        <Mascot mood={moodForStars(stars)} className="results__mascot" />
        <p className="results__label">{t(UI_STRINGS.yourScore, lang)}</p>
        <p className="results__score">{correctCount} / {totalCount}</p>

        <div className="results__stars" aria-label={`${stars} stars`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`results__star ${i < stars ? 'results__star--filled' : ''}`}>★</span>
          ))}
        </div>

        <p className="results__streak">🔥 {t(UI_STRINGS.bestStreak, lang)}: {bestStreak}</p>

        <p className="results__encourage">{t(encouragement(stars), lang)}</p>

        {newBadges.length > 0 && (
          <div className="results__badges edu-pop-in">
            <p className="results__badges-label">🎉 {t(UI_STRINGS.badgeUnlocked, lang)}</p>
            <div className="results__badges-list">
              {newBadges.map((badge) => (
                <div key={badge.id} className="results__badge">
                  <span className="results__badge-icon" aria-hidden="true">{badge.icon}</span>
                  <span className="results__badge-name">{t(badge.name, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="results__actions">
          <button type="button" className="results__btn results__btn--primary" onClick={onRetry}>
            {t(UI_STRINGS.retrySameTopic, lang)}
          </button>
          <button type="button" className="results__btn" onClick={onBackHome}>
            {t(UI_STRINGS.backHome, lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
