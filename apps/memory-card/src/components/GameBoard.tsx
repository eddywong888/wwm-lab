import React, { useState, useEffect, useRef } from 'react';
import type { CardItem, Player } from '../App';
import { Card } from './Card';
import { playFlip, playMatch, playMismatch, playVictory, getMuteState, toggleMute } from '../utils/audio';
import './GameBoard.css';

const SHOUTOUTS = {
  1: ['Well done!', 'Nice!', 'Correct!', 'Match!', 'Good job!'],
  2: ['Awesome!', 'Great job!', 'Spot on!', 'On a roll!', 'Sweet!'],
  3: ['Fantastic!', 'Unstoppable!', 'Brilliant!', 'Memory Master!', 'Sharp!'],
  4: ['Incredible!', 'Mind-blowing!', 'Flawless!', 'Legendary!', 'Phenomenal!']
};

const MISMATCH_SHOUTOUTS = [
  'Not that one!',
  'Nice try!',
  'Ah, so close!',
  'Keep looking!',
  'Peek-a-boo!',
  'Oops!',
  'Almost!',
  'Try again!',
  'Where was it?'
];

const CONFETTI_COLORS = ['#e8960a', '#2b7de9', '#1aa053', '#a01a91', '#e84a4a', '#f5a623'];

interface GameBoardProps {
  cards: CardItem[];
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  onNewGame: () => void;
  onRestartGame: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function generateConfetti() {
  return Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: 4 + (i / 24) * 92 + (Math.random() * 4 - 2),
    delay: Math.random() * 1.4,
    duration: 2.2 + Math.random() * 1.8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 7 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));
}

export const GameBoard: React.FC<GameBoardProps> = ({
  cards,
  players,
  setPlayers,
  onNewGame,
  onRestartGame,
}) => {
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedKeys, setMatchedKeys] = useState<string[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [boardLocked, setBoardLocked] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(getMuteState());
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [shoutout, setShoutout] = useState<{ text: string; level: number; streak: number } | null>(null);

  // New state for game refinements
  const [moves, setMoves] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [peekActive, setPeekActive] = useState<boolean>(false);
  const [peekCountdown, setPeekCountdown] = useState<number>(3);
  const [showFirstPlayerDraw, setShowFirstPlayerDraw] = useState<boolean>(false);
  const [firstPlayerName, setFirstPlayerName] = useState<string>('');
  const [confettiPieces] = useState(generateConfetti);

  const shoutoutTimeoutRef = useRef<number | null>(null);
  const sequenceTimeoutRef = useRef<number | null>(null);

  // Determine grid column counts based on total cards
  let columns = 4;
  if (cards.length === 24) columns = 6;
  else if (cards.length === 32) columns = 8;
  else if (cards.length === 40) columns = 8;
  else if (cards.length === 48) columns = 8;

  const rows = cards.length / columns;

  // Launch the initial draw + peek sequence
  const startSequence = (playerList: Player[]) => {
    setPeekActive(false);
    setPeekCountdown(3);

    if (sequenceTimeoutRef.current !== null) {
      window.clearTimeout(sequenceTimeoutRef.current);
    }

    if (playerList.length > 1) {
      const randomIdx = Math.floor(Math.random() * playerList.length);
      setCurrentPlayerIdx(randomIdx);
      setFirstPlayerName(playerList[randomIdx].name);
      setShowFirstPlayerDraw(true);
      sequenceTimeoutRef.current = window.setTimeout(() => {
        setShowFirstPlayerDraw(false);
        setPeekActive(true);
        sequenceTimeoutRef.current = null;
      }, 1800);
    } else {
      setCurrentPlayerIdx(0);
      setPeekActive(true);
    }
  };

  // On mount: kick off the opening sequence
  useEffect(() => {
    startSequence(players);
    return () => {
      if (sequenceTimeoutRef.current !== null) window.clearTimeout(sequenceTimeoutRef.current);
      if (shoutoutTimeoutRef.current !== null) window.clearTimeout(shoutoutTimeoutRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Peek countdown tick
  useEffect(() => {
    if (!peekActive) return;
    if (peekCountdown <= 0) {
      setPeekActive(false);
      return;
    }
    const tid = window.setTimeout(() => setPeekCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(tid);
  }, [peekActive, peekCountdown]);

  // Elapsed timer — runs only when game is active
  useEffect(() => {
    if (peekActive || showVictory || showFirstPlayerDraw) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [peekActive, showVictory, showFirstPlayerDraw]);

  // Victory check
  useEffect(() => {
    if (matchedKeys.length > 0 && matchedKeys.length === cards.length / 2) {
      setShowVictory(true);
      playVictory();
    }
  }, [matchedKeys, cards]);

  const handleCardClick = (index: number) => {
    if (boardLocked || peekActive || showFirstPlayerDraw || flippedIndices.includes(index) || matchedKeys.includes(cards[index].pairKey)) {
      return;
    }

    playFlip();

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setBoardLocked(true);
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.pairKey === secondCard.pairKey) {
        // MATCH
        setTimeout(() => {
          const nextStreak = currentStreak + 1;
          setCurrentStreak(nextStreak);
          playMatch(nextStreak);
          setMatchedKeys((prev) => [...prev, firstCard.pairKey]);
          setFlippedIndices([]);

          if (shoutoutTimeoutRef.current !== null) {
            window.clearTimeout(shoutoutTimeoutRef.current);
          }
          const levelKey = Math.min(nextStreak, 4) as 1 | 2 | 3 | 4;
          const options = SHOUTOUTS[levelKey];
          const randomText = options[Math.floor(Math.random() * options.length)];
          setShoutout({ text: randomText, level: levelKey, streak: nextStreak });

          shoutoutTimeoutRef.current = window.setTimeout(() => {
            setShoutout(null);
            shoutoutTimeoutRef.current = null;
          }, 1600);

          setPlayers((prevPlayers) =>
            prevPlayers.map((player, idx) => {
              if (idx === currentPlayerIdx) return { ...player, score: player.score + 1 };
              return player;
            })
          );
          setBoardLocked(false);
        }, 500);
      } else {
        // MISMATCH
        playMismatch();
        const randomText = MISMATCH_SHOUTOUTS[Math.floor(Math.random() * MISMATCH_SHOUTOUTS.length)];

        if (shoutoutTimeoutRef.current !== null) {
          window.clearTimeout(shoutoutTimeoutRef.current);
        }
        setShoutout({ text: randomText, level: 0, streak: 0 });
        shoutoutTimeoutRef.current = window.setTimeout(() => {
          setShoutout(null);
          shoutoutTimeoutRef.current = null;
        }, 1100);

        setTimeout(() => {
          setFlippedIndices([]);
          setCurrentStreak(0);
          setCurrentPlayerIdx((prevIdx) => (prevIdx + 1) % players.length);
          setBoardLocked(false);
        }, 1200);
      }
    }
  };

  const handleMuteToggle = () => {
    const muted = toggleMute();
    setIsMuted(muted);
    if (!muted) playFlip();
  };

  const handleRestartClick = () => {
    setFlippedIndices([]);
    setMatchedKeys([]);
    setCurrentStreak(0);
    setShoutout(null);
    setBoardLocked(false);
    setShowVictory(false);
    setMoves(0);
    setElapsedSeconds(0);
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    onRestartGame();
    startSequence(players);
  };

  const getWinnersInfo = () => {
    if (players.length === 1) return { text: 'Congratulations! You matched all pairs!', scores: '' };

    let maxScore = -1;
    let winners: Player[] = [];
    players.forEach((p) => {
      if (p.score > maxScore) {
        maxScore = p.score;
        winners = [p];
      } else if (p.score === maxScore) {
        winners.push(p);
      }
    });

    if (winners.length === players.length && players.every((p) => p.score === players[0].score)) {
      return { text: "It's a tie!", scores: `All players scored ${maxScore} points.` };
    }
    if (winners.length > 1) {
      const names = winners.map((w) => w.name).join(' & ');
      return { text: `It's a Tie between ${names}!`, scores: `With ${maxScore} points each.` };
    }
    return { text: `${winners[0].name} wins the match!`, scores: `Scored ${maxScore} points.` };
  };

  const winners = getWinnersInfo();
  const totalPairs = cards.length / 2;
  const efficiency = moves > 0 ? (moves / totalPairs).toFixed(1) : '-';

  return (
    <div className="game-board-container">
      {/* HUD Header */}
      <header className="game-hud">
        <div className="hud-brand" onClick={onNewGame} style={{ cursor: 'pointer' }}>
          <span className="hud-logo">WWM</span>
          <span className="hud-title">Memory Card</span>
        </div>

        <div className="hud-actions">
          <button
            type="button"
            className="hud-btn mute-hud-btn"
            onClick={handleMuteToggle}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
          <button type="button" className="hud-btn" onClick={handleRestartClick}>
            Restart
          </button>
          <button type="button" className="hud-btn primary" onClick={onNewGame}>
            New Game
          </button>
        </div>
      </header>

      {/* Scoreboard */}
      <div className="game-scoreboard">
        {players.map((player, idx) => {
          const isActive = idx === currentPlayerIdx && players.length > 1 && !showVictory;
          return (
            <div
              key={player.id}
              className={`score-card ${isActive ? 'active' : ''}`}
              style={{ borderLeft: `4px solid var(--player-${idx + 1}, var(--amber))` }}
            >
              <div className="score-card-header">
                <span className="player-indicator-dot" style={{ backgroundColor: `var(--player-${idx + 1}, var(--amber))` }} />
                <span className="player-name">{player.name}</span>
              </div>
              <div className="player-score">{player.score}</div>
              {isActive && <div className="active-turn-indicator">Your Turn</div>}
            </div>
          );
        })}
      </div>

      {/* Game Status + Stats Bar */}
      <div className="game-status-bar">
        {players.length > 1 && !showVictory ? (
          <p className="game-status-text">
            It is <span className="active-player-name" style={{ color: `var(--player-${currentPlayerIdx + 1}, var(--amber))` }}>{players[currentPlayerIdx].name}</span>'s turn.
          </p>
        ) : (
          <p className="game-status-text">
            Match pairs to clear the board. {matchedKeys.length} / {totalPairs} pairs found.
          </p>
        )}
        {!showVictory && !peekActive && !showFirstPlayerDraw && (
          <div className="game-stats-row">
            <span className="stat-item">⏱ {formatTime(elapsedSeconds)}</span>
            <span className="stat-divider">·</span>
            <span className="stat-item">🎯 {moves} moves</span>
          </div>
        )}
      </div>

      {/* Card Grid Container */}
      <div className="card-grid-wrapper">
        {peekActive && (
          <div className="peek-banner">
            <span className="peek-text">Memorise!</span>
            <span className="peek-countdown">{peekCountdown}</span>
          </div>
        )}
        <div
          className="card-grid"
          style={{ '--cols': columns, '--rows': rows } as React.CSSProperties}
        >
          {cards.map((card, index) => {
            const isFlipped = flippedIndices.includes(index);
            const isMatched = matchedKeys.includes(card.pairKey);
            return (
              <Card
                key={card.id}
                id={card.id}
                name={card.name}
                image={card.image}
                isFlipped={isFlipped || peekActive}
                isMatched={isMatched}
                onClick={() => handleCardClick(index)}
                disabled={boardLocked || isMatched || peekActive || showFirstPlayerDraw}
              />
            );
          })}
        </div>
      </div>

      {/* Shoutout Badge Overlay */}
      {shoutout && (
        <div className={`streak-badge streak-level-${shoutout.level}`} key={`${shoutout.streak}-${shoutout.text}`}>
          <div className="streak-badge-title">{shoutout.text}</div>
          {shoutout.level > 0 && (
            <div className="streak-badge-sub">
              <span className="streak-fire-icon">🔥</span> Streak x{shoutout.streak}
            </div>
          )}
        </div>
      )}

      {/* Who Goes First overlay (multiplayer only) */}
      {showFirstPlayerDraw && (
        <div className="first-player-overlay">
          <div className="first-player-modal">
            <div className="first-player-dice">🎲</div>
            <p className="first-player-text">
              <strong>{firstPlayerName}</strong> goes first!
            </p>
          </div>
        </div>
      )}

      {/* Victory Overlay Modal */}
      {showVictory && (
        <>
          <div className="confetti-container" aria-hidden="true">
            {confettiPieces.map((piece) => (
              <span
                key={piece.id}
                className="confetti-piece"
                style={{
                  left: `${piece.left}%`,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                  backgroundColor: piece.color,
                  width: `${piece.size}px`,
                  height: `${piece.size}px`,
                  '--rotate': `${piece.rotate}deg`,
                } as React.CSSProperties}
              />
            ))}
          </div>
          <div className="victory-overlay">
            <div className="victory-modal">
              <div className="victory-logo">🏆</div>
              <h2 className="victory-title">{winners.text}</h2>
              <p className="victory-scores">{winners.scores}</p>

              <div className="victory-game-stats">
                <div className="victory-stat">
                  <span className="victory-stat-icon">⏱</span>
                  <span className="victory-stat-value">{formatTime(elapsedSeconds)}</span>
                  <span className="victory-stat-label">time</span>
                </div>
                <div className="victory-stat">
                  <span className="victory-stat-icon">🎯</span>
                  <span className="victory-stat-value">{moves}</span>
                  <span className="victory-stat-label">moves</span>
                </div>
                {players.length === 1 && (
                  <div className="victory-stat">
                    <span className="victory-stat-icon">⚡</span>
                    <span className="victory-stat-value">{efficiency}×</span>
                    <span className="victory-stat-label">efficiency</span>
                  </div>
                )}
              </div>

              <div className="victory-scoreboard">
                <h3>Final Standings</h3>
                {players
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => (
                    <div key={p.id} className="victory-rank-row">
                      <span className="rank-num">#{idx + 1}</span>
                      <span className="rank-name">{p.name}</span>
                      <span className="rank-score">{p.score} pairs</span>
                    </div>
                  ))}
              </div>
              <div className="victory-actions">
                <button type="button" className="victory-btn" onClick={handleRestartClick}>
                  Play Again
                </button>
                <button type="button" className="victory-btn primary" onClick={onNewGame}>
                  Change Settings
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
