import { useEffect } from 'react';
import './Results.css';
import type { Lang } from '../engine/types';
import { t, UI_STRINGS } from '../engine/i18n';
import { playSessionFanfare } from '../audio/sfx';

interface ResultsProps {
  lang: Lang;
  correctCount: number;
  totalCount: number;
  bestStreak: number;
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

export default function Results({ lang, correctCount, totalCount, bestStreak, onRetry, onBackHome }: ResultsProps) {
  const stars = starsFor(correctCount);

  useEffect(() => {
    playSessionFanfare();
  }, []);

  return (
    <div className="results">
      <div className="results__card edu-pop-in">
        <p className="results__label">{t(UI_STRINGS.yourScore, lang)}</p>
        <p className="results__score">{correctCount} / {totalCount}</p>

        <div className="results__stars" aria-label={`${stars} stars`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`results__star ${i < stars ? 'results__star--filled' : ''}`}>★</span>
          ))}
        </div>

        <p className="results__streak">🔥 {t(UI_STRINGS.bestStreak, lang)}: {bestStreak}</p>

        <p className="results__encourage">{t(encouragement(stars), lang)}</p>

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
