import './StreakBadge.css';
import Icon from './Icon';

interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  const size = streak >= 5 ? 'big' : streak >= 3 ? 'medium' : 'small';
  return (
    <div className={`streak-badge streak-badge--${size} ${streak > 0 ? 'edu-bounce' : ''}`} key={streak}>
      <Icon name="flame" className="streak-badge__flame" />
      <span className="streak-badge__count">{streak}</span>
    </div>
  );
}
