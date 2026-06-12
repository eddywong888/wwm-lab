import { useState, useEffect } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { GameBoard } from './components/GameBoard';
import { COUNTRIES, getFlagUrl } from './data/countries';
import { ANIMALS } from './data/emojis';
import { getCustomImages } from './utils/db';
import type { CustomImage } from './utils/db';
import './App.css';

export type GameTheme = 'flags' | 'uploads' | 'emojis';

export interface Player {
  id: number;
  name: string;
  score: number;
}

export interface CardItem {
  id: string;
  pairKey: string;
  name: string;
  image: string;
}

export default function App() {
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1']);
  const [level, setLevel] = useState<number>(8); // pairs count
  const [theme, setTheme] = useState<GameTheme>('flags');
  const [customImages, setCustomImages] = useState<CustomImage[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);

  // Load custom images from DB on mount
  useEffect(() => {
    async function loadImages() {
      const images = await getCustomImages();
      setCustomImages(images);
    }
    loadImages();
  }, []);

  // Fisher-Yates Shuffling algorithm
  const shuffle = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const generateGameBoard = () => {
    let selectedPairs: { pairKey: string; name: string; image: string }[] = [];

    if (theme === 'flags') {
      // Shuffle the list of countries first, then pick the requested number of pairs
      const shuffledCountries = shuffle(COUNTRIES).slice(0, level);
      selectedPairs = shuffledCountries.map((c) => ({
        pairKey: c.code,
        name: c.name,
        image: getFlagUrl(c.code),
      }));
    } else if (theme === 'emojis') {
      const shuffledAnimals = shuffle(ANIMALS).slice(0, level);
      selectedPairs = shuffledAnimals.map((a) => ({
        pairKey: a.emoji,
        name: a.name,
        image: a.emoji,
      }));
    } else {
      // custom uploads theme
      const selectedUploads = customImages.slice(0, level);
      selectedPairs = selectedUploads.map((img) => ({
        pairKey: img.id,
        name: img.name,
        image: img.dataUrl,
      }));
    }

    // Create two cards for each pair
    const boardCards: CardItem[] = [];
    selectedPairs.forEach((pair) => {
      boardCards.push({
        id: `${pair.pairKey}-card-1`,
        pairKey: pair.pairKey,
        name: pair.name,
        image: pair.image,
      });
      boardCards.push({
        id: `${pair.pairKey}-card-2`,
        pairKey: pair.pairKey,
        name: pair.name,
        image: pair.image,
      });
    });

    // Shuffle the final board cards
    setCards(shuffle(boardCards));
  };

  const handleStartGame = () => {
    // Generate initial players list
    const initialPlayers: Player[] = Array.from({ length: playerCount }).map((_, idx) => ({
      id: idx + 1,
      name: playerNames[idx]?.trim() || `Player ${idx + 1}`,
      score: 0,
    }));

    setPlayers(initialPlayers);
    generateGameBoard();
    setGameState('playing');
  };

  const handleRestartGame = () => {
    generateGameBoard();
  };

  const handleNewGame = () => {
    setGameState('setup');
  };

  return (
    <main className="app-main-layout">
      <div className="container">
        {gameState === 'setup' ? (
          <SetupScreen
            playerCount={playerCount}
            setPlayerCount={setPlayerCount}
            playerNames={playerNames}
            setPlayerNames={setPlayerNames}
            level={level}
            setLevel={setLevel}
            theme={theme}
            setTheme={setTheme}
            customImages={customImages}
            setCustomImages={setCustomImages}
            onStartGame={handleStartGame}
          />
        ) : (
          <GameBoard
            cards={cards}
            players={players}
            setPlayers={setPlayers}
            onNewGame={handleNewGame}
            onRestartGame={handleRestartGame}
          />
        )}
      </div>
    </main>
  );
}
