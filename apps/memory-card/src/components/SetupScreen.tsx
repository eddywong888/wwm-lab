import React from 'react';
import type { GameTheme } from '../App';
import type { CustomImage } from '../utils/db';
import { UploadManager } from './UploadManager';
import { toggleMute, getMuteState, playFlip } from '../utils/audio';
import './SetupScreen.css';

interface SetupScreenProps {
  playerCount: number;
  setPlayerCount: (count: number) => void;
  playerNames: string[];
  setPlayerNames: (names: string[]) => void;
  level: number;
  setLevel: (level: number) => void;
  theme: GameTheme;
  setTheme: (theme: GameTheme) => void;
  customImages: CustomImage[];
  setCustomImages: (images: CustomImage[]) => void;
  onStartGame: () => void;
}

const LEVELS = [
  { value: 8, label: '16 Cards (8 pairs)' },
  { value: 16, label: '32 Cards (16 pairs)' },
  { value: 24, label: '48 Cards (24 pairs)' },
  { value: 32, label: '64 Cards (32 pairs)' },
  { value: 40, label: '80 Cards (40 pairs)' },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  playerCount,
  setPlayerCount,
  playerNames,
  setPlayerNames,
  level,
  setLevel,
  theme,
  setTheme,
  customImages,
  setCustomImages,
  onStartGame,
}) => {
  const [muted, setMuted] = React.useState(getMuteState());

  const handlePlayerCountChange = (count: number) => {
    playFlip();
    setPlayerCount(count);
    // Adjust player names array size
    const newNames = [...playerNames];
    if (newNames.length < count) {
      for (let i = newNames.length; i < count; i++) {
        newNames.push(`Player ${i + 1}`);
      }
    } else if (newNames.length > count) {
      newNames.splice(count);
    }
    setPlayerNames(newNames);
  };

  const handlePlayerNameChange = (index: number, val: string) => {
    const newNames = [...playerNames];
    newNames[index] = val;
    setPlayerNames(newNames);
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    playFlip();
    setLevel(parseInt(e.target.value, 10));
  };

  const handleThemeChange = (newTheme: GameTheme) => {
    playFlip();
    setTheme(newTheme);
  };

  const handleMuteToggle = () => {
    const isMuted = toggleMute();
    setMuted(isMuted);
    if (!isMuted) playFlip();
  };

  const isUploadThemeValid = theme === 'flags' || customImages.length >= level;

  return (
    <div className="setup-screen">
      <header className="setup-header">
        <div className="setup-logo">MC</div>
        <h1 className="setup-title">Memory Card</h1>
        <p className="setup-subtitle">Challenge your mind. Match pairs. Win the board.</p>
      </header>

      <div className="setup-body">
        {/* Step 1: Players Selection */}
        <section className="setup-section">
          <h2 className="section-title">1. Players</h2>
          <div className="button-group">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                className={`setup-btn ${playerCount === num ? 'active' : ''}`}
                onClick={() => handlePlayerCountChange(num)}
              >
                {num === 1 ? 'Solo' : `${num} Players`}
              </button>
            ))}
          </div>

          <div className="player-names-list">
            {Array.from({ length: playerCount }).map((_, idx) => (
              <div key={idx} className="player-name-field">
                <span className="player-label-indicator" style={{ borderColor: `var(--player-${idx + 1}, var(--amber))` }}>
                  P{idx + 1}
                </span>
                <input
                  type="text"
                  value={playerNames[idx] || ''}
                  onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                  className="player-name-input"
                  placeholder={`Player ${idx + 1} Name`}
                  maxLength={15}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Step 2: Difficulty Selection */}
        <section className="setup-section">
          <h2 className="section-title">2. Difficulty</h2>
          <div className="select-wrapper">
            <select value={level} onChange={handleLevelChange} className="setup-select">
              {LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Step 3: Theme Selection */}
        <section className="setup-section">
          <h2 className="section-title">3. Card Theme</h2>
          <div className="button-group">
            <button
              type="button"
              className={`setup-btn ${theme === 'flags' ? 'active' : ''}`}
              onClick={() => handleThemeChange('flags')}
            >
              Country Flags
            </button>
            <button
              type="button"
              className={`setup-btn ${theme === 'uploads' ? 'active' : ''}`}
              onClick={() => handleThemeChange('uploads')}
            >
              Custom Uploads
            </button>
          </div>

          {theme === 'uploads' && (
            <div className="theme-upload-container">
              <UploadManager
                customImages={customImages}
                onImagesChanged={setCustomImages}
                requiredPairs={level}
              />
            </div>
          )}
        </section>
      </div>

      <footer className="setup-footer">
        <button
          type="button"
          onClick={handleMuteToggle}
          className="mute-btn"
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>

        <button
          type="button"
          disabled={!isUploadThemeValid}
          onClick={onStartGame}
          className="start-game-btn"
        >
          Start Match
        </button>
      </footer>
    </div>
  );
};
