import './TopicCard.css';
import type { Lang } from '../engine/types';
import { t, UI_STRINGS } from '../engine/i18n';

interface TopicCardProps {
  icon: string;
  name: { en: string; zh: string };
  bestStreak: number;
  stars: number;
  onClick: () => void;
  lang: Lang;
}

export default function TopicCard({ icon, name, bestStreak, stars, onClick, lang }: TopicCardProps) {
  return (
    <button type="button" className="topic-card" onClick={onClick}>
      <span className="topic-card__icon" aria-hidden="true">{icon}</span>
      <span className="topic-card__copy">
        <span className="topic-card__name">{t(name, lang)}</span>
        <span className="topic-card__progress">
          {stars > 0 ? `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}` : t(UI_STRINGS.newTopic, lang)}
          {bestStreak > 0 && <span className="topic-card__streak"> · 🔥 {bestStreak}</span>}
        </span>
      </span>
      {stars === 3 && <span className="topic-card__mastery" aria-label={t(UI_STRINGS.mastered, lang)} />}
    </button>
  );
}
