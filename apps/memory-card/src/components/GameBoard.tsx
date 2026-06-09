import React, { useState, useEffect } from 'react';
import type { CardItem, Player } from '../App';
import { Card } from './Card';
import { playFlip, playMatch, playMismatch, playVictory, getMuteState, toggleMute } from '../utils/audio';
import './GameBoard.css';

interface GameBoardProps {
  cards: CardItem[];
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  onNewGame: () => void;
  onRestartGame: () => void;
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

  // Determine grid column counts based on total cards
  let columns = 4;
  if (cards.length === 32) columns = 8;
  else if (cards.length === 48) columns = 8;
  else if (cards.length === 64) columns = 8;
  else if (cards.length === 80) columns = 10;

  // Handle victory check
  useEffect(() => {
    if (matchedKeys.length > 0 && matchedKeys.length === cards.length / 2) {
      setShowVictory(true);
      playVictory();
    }
  }, [matchedKeys, cards]);

  const handleCardClick = (index: number) => {
    if (boardLocked || flippedIndices.includes(index) || matchedKeys.includes(cards[index].pairKey)) {
      return;
    }

    playFlip();

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // If 2 cards are now flipped, evaluate match
    if (newFlipped.length === 2) {
      setBoardLocked(true);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.pairKey === secondCard.pairKey) {
        // MATCH FOUND
        setTimeout(() => {
          playMatch();
          setMatchedKeys((prev) => [...prev, firstCard.pairKey]);
          setFlippedIndices([]);
          
          // Increment score for current player
          setPlayers((prevPlayers) =>
            prevPlayers.map((player, idx) => {
              if (idx === currentPlayerIdx) {
                return { ...player, score: player.score + 1 };
              }
              return player;
            })
          );
          
          setBoardLocked(false);
        }, 500);
      } else {
        // NO MATCH
        setTimeout(() => {
          playMismatch();
          setFlippedIndices([]);
          
          // Turn passes to next player
          setCurrentPlayerIdx((prevIdx) => (prevIdx + 1) % players.length);
          setBoardLocked(false);
        }, 1200);
      }
    }
  };

  const handleMuteToggle = () => {
    const isMuted = toggleMute();
    setIsMuted(isMuted);
    if (!isMuted) playFlip();
  };

  const handleRestartClick = () => {
    setFlippedIndices([]);
    setMatchedKeys([]);
    setCurrentPlayerIdx(0);
    setBoardLocked(false);
    setShowVictory(false);
    // Reset scores
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    onRestartGame();
  };

  // Find winner(s)
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

    if (winners.length === players.length && players.every(p => p.score === players[0].score)) {
      return { text: "It's a tie!", scores: `All players scored ${maxScore} points.` };
    }

    if (winners.length > 1) {
      const names = winners.map((w) => w.name).join(' & ');
      return { text: `It's a Tie between ${names}!`, scores: `With ${maxScore} points each.` };
    }

    return { text: `${winners[0].name} wins the match!`, scores: `Scored ${maxScore} points.` };
  };

  const winners = getWinnersInfo();

  return (
    <div className="game-board-container">
      {/* HUD Header */}
      <header className="game-hud">
        <div className="hud-brand" onClick={onNewGame} style={{ cursor: 'pointer' }}>
          <span className="hud-logo">MC</span>
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
              style={{
                borderLeft: `4px solid var(--player-${idx + 1}, var(--amber))`,
              }}
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

      {/* Game Message */}
      <div className="game-status-bar">
        {players.length > 1 && !showVictory ? (
          <p className="game-status-text">
            It is <span className="active-player-name" style={{ color: `var(--player-${currentPlayerIdx + 1}, var(--amber))` }}>{players[currentPlayerIdx].name}</span>'s turn.
          </p>
        ) : (
          <p className="game-status-text">
            Match pairs to clear the board. {matchedKeys.length} / {cards.length / 2} pairs found.
          </p>
        )}
      </div>

      {/* Card Grid Container */}
      <div className="card-grid-wrapper">
        <div
          className="card-grid"
          style={
            {
              '--cols': columns,
            } as React.CSSProperties
          }
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
                isFlipped={isFlipped}
                isMatched={isMatched}
                onClick={() => handleCardClick(index)}
                disabled={boardLocked || isMatched}
              />
            );
          })}
        </div>
      </div>

      {/* Victory Overlay Modal */}
      {showVictory && (
        <div className="victory-overlay">
          <div className="victory-modal">
            <div className="victory-logo">🏆</div>
            <h2 className="victory-title">{winners.text}</h2>
            <p className="victory-scores">{winners.scores}</p>
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
      )}
    </div>
  );
};
