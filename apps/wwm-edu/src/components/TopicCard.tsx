import './TopicCard.css';
import type { Lang } from '../engine/types';
import { t } from '../engine/i18n';

interface TopicCardProps {
  icon: string;
  name: { en: string; zh: string };
  bestStreak: number;
  onClick: () => void;
  lang: Lang;
  accent?: 'default' | 'mixed';
}

export default function TopicCard({ icon, name, bestStreak, onClick, lang, accent = 'default' }: TopicCardProps) {
  return (
    <button type="button" className={`topic-card ${accent === 'mixed' ? 'topic-card--mixed' : ''}`} onClick={onClick}>
      <span className="topic-card__icon">{icon}</span>
      <span className="topic-card__name">{t(name, lang)}</span>
      {bestStreak > 0 && (
        <span className="topic-card__streak">🔥 {bestStreak}</span>
      )}
    </button>
  );
}
