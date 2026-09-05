import './BadgeShelf.css';
import type { Lang } from '../engine/types';
import type { EduState } from '../store/local';
import { computeBadges, type BadgeTier } from '../engine/badges';
import { t, UI_STRINGS } from '../engine/i18n';
import { playButtonTap } from '../audio/sfx';

interface BadgeShelfProps {
  lang: Lang;
  state: EduState;
  onOpenBadges: () => void;
}

const TIER_RANK: Record<BadgeTier, number> = { bronze: 1, silver: 2, gold: 3 };
const MAX_SHOWN = 6;

export default function BadgeShelf({ lang, state, onOpenBadges }: BadgeShelfProps) {
  const earned = computeBadges(state).filter((b) => b.tier !== null);
  const sorted = [...earned].sort((a, b) => TIER_RANK[b.tier!] - TIER_RANK[a.tier!]);
  const shown = sorted.slice(0, MAX_SHOWN);

  return (
    <button type="button" className="badge-shelf" onClick={() => { playButtonTap(); onOpenBadges(); }}>
      {shown.length === 0 ? (
        <p className="badge-shelf__empty">🎖️ {t(UI_STRINGS.badgeShelfEmpty, lang)}</p>
      ) : (
        <>
          <div className="badge-shelf__icons">
            {shown.map((b) => (
              <span key={b.def.id} className={`badge-shelf__icon badge-shelf__icon--${b.tier}`} aria-hidden="true">
                {b.def.icon}
              </span>
            ))}
          </div>
          <span className="badge-shelf__count">
            {earned.length} {t(UI_STRINGS.badgeShelfCount, lang)}
          </span>
        </>
      )}
    </button>
  );
}
