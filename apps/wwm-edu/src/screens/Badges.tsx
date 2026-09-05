import './Badges.css';
import type { Lang } from '../engine/types';
import type { EduState } from '../store/local';
import { computeBadges, BADGE_DEFS, type BadgeTier } from '../engine/badges';
import { t, UI_STRINGS } from '../engine/i18n';

interface BadgesProps {
  lang: Lang;
  state: EduState;
  onBackHome: () => void;
}

const TIER_LABEL: Record<BadgeTier, keyof typeof UI_STRINGS> = {
  bronze: 'badgeTierBronze',
  silver: 'badgeTierSilver',
  gold: 'badgeTierGold',
};

export default function Badges({ lang, state, onBackHome }: BadgesProps) {
  const earned = computeBadges(state);
  const totalTiers = BADGE_DEFS.length * 3;
  const earnedTiers = earned.reduce((sum, b) => {
    if (b.tier === 'gold') return sum + 3;
    if (b.tier === 'silver') return sum + 2;
    if (b.tier === 'bronze') return sum + 1;
    return sum;
  }, 0);

  return (
    <div className="badges">
      <div className="badges__card edu-pop-in">
        <button type="button" className="badges__back" onClick={onBackHome}>
          ← {t(UI_STRINGS.backHome, lang)}
        </button>
        <h1 className="badges__title">🎖️ {t(UI_STRINGS.badges, lang)}</h1>
        <p className="badges__subtitle">
          {earnedTiers} / {totalTiers} {t(UI_STRINGS.badgesEarnedCount, lang)}
        </p>

        <div className="badges__grid">
          {earned.map((b) => {
            const isMaxed = b.tier === 'gold';
            const locked = b.tier === null;
            const barBase = b.tier ? (b.tier === 'bronze' ? 0 : b.tier === 'silver' ? BADGE_DEFS.find((d) => d.id === b.def.id)!.tiers[0].threshold : BADGE_DEFS.find((d) => d.id === b.def.id)!.tiers[1].threshold) : 0;
            const barTarget = b.next ?? b.value;
            const pct = isMaxed ? 100 : Math.max(0, Math.min(100, ((b.value - barBase) / Math.max(1, barTarget - barBase)) * 100));
            return (
              <div
                key={b.def.id}
                className={`badges__item ${locked ? 'badges__item--locked' : `badges__item--${b.tier}`}`}
              >
                <div className="badges__icon-wrap">
                  <span className="badges__icon" aria-hidden="true">{b.def.icon}</span>
                </div>
                <p className="badges__name">{t(b.def.name, lang)}</p>
                {b.tier && <p className="badges__tier-label">{t(UI_STRINGS[TIER_LABEL[b.tier]], lang)}</p>}
                <p className="badges__desc">{t(b.def.description, lang)}</p>
                {isMaxed ? (
                  <p className="badges__max">✨ {t(UI_STRINGS.badgeMax, lang)}</p>
                ) : (
                  <div className="badges__progress">
                    <div className="badges__progress-bar">
                      <div className="badges__progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="badges__progress-text">
                      {Math.floor(b.value)} / {b.next}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
