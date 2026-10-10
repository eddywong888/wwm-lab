import './TopicCard.css';
import type { IconName, Lang } from '../engine/types';
import { t, UI_STRINGS } from '../engine/i18n';
import Icon from './Icon';

interface TopicCardProps {
  icon: IconName;
  name: { en: string; zh: string };
  bestStreak: number;
  stars: number;
  onClick: () => void;
  lang: Lang;
}

export default function TopicCard({ icon, name, bestStreak, stars, onClick, lang }: TopicCardProps) {
  return (
    <button type="button" className="topic-card" onClick={onClick}>
      <span className="topic-card__icon"><Icon name={icon} /></span>
      <span className="topic-card__copy">
        <span className="topic-card__name">{t(name, lang)}</span>
        <span className="topic-card__progress">
          {stars > 0 ? <span className="topic-card__stars" aria-label={`${stars} ${t(UI_STRINGS.stars, lang)}`}>{[0, 1, 2].map((item) => <Icon key={item} name="star" className={item < stars ? 'topic-card__star--filled' : ''} />)}</span> : t(UI_STRINGS.newTopic, lang)}
          {bestStreak > 0 && <span className="topic-card__streak"> · <Icon name="flame" /> {bestStreak}</span>}
        </span>
      </span>
      {stars === 3 && <span className="topic-card__mastery" aria-label={t(UI_STRINGS.mastered, lang)} />}
    </button>
  );
}
