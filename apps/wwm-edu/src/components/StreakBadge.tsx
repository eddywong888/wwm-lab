import './StreakBadge.css';

interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  const size = streak >= 5 ? 'big' : streak >= 3 ? 'medium' : 'small';
  return (
    <div className={`streak-badge streak-badge--${size} ${streak > 0 ? 'edu-bounce' : ''}`} key={streak}>
      <span className="streak-badge__flame">🔥</span>
      <span className="streak-badge__count">{streak}</span>
    </div>
  );
}
