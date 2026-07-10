import { useState } from 'react';
import './App.css';
import Home from './screens/Home';
import Exercise from './screens/Exercise';
import Results from './screens/Results';
import { loadState, updateState, recordSession } from './store/local';
import type { Difficulty, Lang } from './engine/types';
import { unlockAudio } from './audio/sfx';

type Screen = 'home' | 'exercise' | 'results';

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [screen, setScreen] = useState<Screen>('home');
  const [topicId, setTopicId] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [lastResult, setLastResult] = useState<{ correct: number; total: number; bestStreak: number } | null>(null);

  function changeLang(lang: Lang) {
    setState(updateState({ lang }));
  }

  function changeDifficulty(difficulty: Difficulty) {
    setState(updateState({ difficulty }));
  }

  function handleMuteChange(muted: boolean) {
    setState(updateState({ muted }));
  }

  function selectTopic(id: string) {
    unlockAudio();
    setTopicId(id);
    setSessionKey((k) => k + 1);
    setScreen('exercise');
  }

  function finishExercise(correctCount: number, totalCount: number, bestStreak: number) {
    if (topicId) {
      setState(recordSession(topicId, correctCount, totalCount, bestStreak));
    }
    setLastResult({ correct: correctCount, total: totalCount, bestStreak });
    setScreen('results');
  }

  function retrySameTopic() {
    setSessionKey((k) => k + 1);
    setScreen('exercise');
  }

  function backHome() {
    setTopicId(null);
    setScreen('home');
  }

  return (
    <main className="app" onPointerDownCapture={unlockAudio}>
      {screen === 'home' && (
        <Home
          state={state}
          onChangeLang={changeLang}
          onChangeDifficulty={changeDifficulty}
          onSelectTopic={selectTopic}
          onMuteChange={handleMuteChange}
        />
      )}
      {screen === 'exercise' && topicId && (
        <Exercise
          topicId={topicId}
          difficulty={state.difficulty}
          lang={state.lang}
          onFinish={finishExercise}
          sessionKey={sessionKey}
        />
      )}
      {screen === 'results' && lastResult && (
        <Results
          lang={state.lang}
          correctCount={lastResult.correct}
          totalCount={lastResult.total}
          bestStreak={lastResult.bestStreak}
          onRetry={retrySameTopic}
          onBackHome={backHome}
        />
      )}
    </main>
  );
}
