import { useEffect, useState } from 'react';
import './Leaderboard.css';
import type { Lang } from '../engine/types';
import type { Account } from '../store/local';
import { fetchLeaderboard, type LeaderboardEntry } from '../store/sync';
import { t, UI_STRINGS } from '../engine/i18n';

interface LeaderboardProps {
  lang: Lang;
  account?: Account;
  onBackHome: () => void;
}

type LoadState = 'loading' | 'ok' | 'error';

export default function Leaderboard({ lang, account, onBackHome }: LeaderboardProps) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [week, setWeek] = useState<string>('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard().then((res) => {
      if (cancelled) return;
      if (!res) {
        setLoadState('error');
        return;
      }
      setWeek(res.week);
      setEntries(res.entries);
      setLoadState('ok');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="leaderboard">
      <div className="leaderboard__card edu-pop-in">
        <button type="button" className="leaderboard__back" onClick={onBackHome}>
          ← {t(UI_STRINGS.backHome, lang)}
        </button>
        <h1 className="leaderboard__title">🏆 {t(UI_STRINGS.leaderboard, lang)}</h1>
        <p className="leaderboard__subtitle">{t(UI_STRINGS.thisWeek, lang)}{week ? ` (${week})` : ''}</p>

        {loadState === 'loading' && <p className="leaderboard__status">…</p>}

        {loadState === 'error' && <p className="leaderboard__status">{t(UI_STRINGS.leaderboardOffline, lang)}</p>}

        {loadState === 'ok' && entries.length === 0 && (
          <p className="leaderboard__status">{t(UI_STRINGS.leaderboardEmpty, lang)}</p>
        )}

        {loadState === 'ok' && entries.length > 0 && (
          <ol className="leaderboard__list">
            {entries.map((entry, i) => {
              const isMe = !!account && entry.nickname === account.nickname;
              return (
                <li key={`${entry.nickname}-${i}`} className={`leaderboard__row ${isMe ? 'leaderboard__row--me' : ''}`}>
                  <span className="leaderboard__rank">#{i + 1}</span>
                  <span className="leaderboard__nickname">{entry.nickname}</span>
                  <span className="leaderboard__days" aria-hidden="true">
                    {'🟢'.repeat(Object.keys(entry.days).length)}
                  </span>
                  <span className="leaderboard__total">{entry.total} {t(UI_STRINGS.points, lang)}</span>
                </li>
              );
            })}
          </ol>
        )}

        {!account && loadState === 'ok' && (
          <p className="leaderboard__hint">{t(UI_STRINGS.leaderboardSignInHint, lang)}</p>
        )}
      </div>
    </div>
  );
}
