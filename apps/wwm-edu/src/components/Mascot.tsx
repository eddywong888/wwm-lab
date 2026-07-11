import './Mascot.css';

export type MascotMood = 'idle' | 'happy' | 'sad' | 'celebrate';

const MOOD_ACCESSORY: Partial<Record<MascotMood, string>> = {
  happy: '✨',
  sad: '💧',
  celebrate: '🎉',
};

interface MascotProps {
  mood: MascotMood;
  className?: string;
}

/** The 🦉 owl mascot, re-rendered with a mood-specific animation + small
 * accessory emoji. `key={mood}` on the wrapper restarts the animation
 * every time the mood changes (e.g. a fresh correct/wrong per question). */
export default function Mascot({ mood, className = '' }: MascotProps) {
  const accessory = MOOD_ACCESSORY[mood];
  return (
    <span className={`mascot mascot--${mood} ${className}`} aria-hidden="true" key={mood}>
      <span className="mascot__owl">🦉</span>
      {accessory && <span className="mascot__accessory">{accessory}</span>}
    </span>
  );
}
