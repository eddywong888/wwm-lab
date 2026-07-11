import { useEffect, useState } from 'react';
import './App.css';
import Home from './screens/Home';
import Exercise from './screens/Exercise';
import Results from './screens/Results';
import Leaderboard from './screens/Leaderboard';
import Admin from './screens/Admin';
import { loadState, updateState, recordSession, recordDailyResult } from './store/local';
import type { Difficulty, Lang } from './engine/types';
import { unlockAudio } from './audio/sfx';
import { DAILY_TOPIC_ID, todayDateString } from './engine/session';
import { pushProgress, pushLeaderboard } from './store/sync';
import { signIn, signOut } from './store/account';
import { refreshEnglishContent } from './engine/english';

type Screen = 'home' | 'exercise' | 'results' | 'leaderboard' | 'admin';

function screenFromHash(): Screen {
  return window.location.hash === '#admin' ? 'admin' : 'home';
}

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [screen, setScreen] = useState<Screen>(() => screenFromHash());
  const [topicId, setTopicId] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [lastResult, setLastResult] = useState<{ correct: number; total: number; bestStreak: number } | null>(null);

  // Hash-based route for the hidden admin content-override page — never
  // linked from any UI, reachable only by visiting #admin directly.
  useEffect(() => {
    function onHashChange() {
      setScreen(screenFromHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Content overrides (Phase 3 KV packs) and, if already signed in,
  // server progress — both fire-and-forget, the app works fully offline.
  useEffect(() => {
    void refreshEnglishContent();
    const userKey = state.account?.userKey;
    if (userKey) void pushProgress(userKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeLang(lang: Lang) {
    setState(updateState({ lang }));
  }

  function changeDifficulty(difficulty: Difficulty) {
    setState(updateState({ difficulty }));
  }

  function handleMuteChange(muted: boolean) {
    setState(updateState({ muted }));
  }

  async function handleSignIn(nickname: string, pin: string) {
    const merged = await signIn(nickname, pin);
    setState(merged);
  }

  function handleSignOut() {
    setState(signOut());
  }

  function selectTopic(id: string) {
    unlockAudio();
    setTopicId(id);
    setSessionKey((k) => k + 1);
    setScreen('exercise');
  }

  function openLeaderboard() {
    setScreen('leaderboard');
  }

  function finishExercise(correctCount: number, totalCount: number, bestStreak: number) {
    let nextState = state;
    if (topicId === DAILY_TOPIC_ID) {
      nextState = recordDailyResult(todayDateString(), correctCount, bestStreak);
    } else if (topicId) {
      nextState = recordSession(topicId, correctCount, totalCount, bestStreak);
    }
    setState(nextState);

    const account = nextState.account;
    if (account) {
      void pushProgress(account.userKey);
      if (topicId === DAILY_TOPIC_ID) {
        void pushLeaderboard({
          u: account.userKey,
          nickname: account.nickname,
          score: correctCount,
          streak: bestStreak,
          date: todayDateString(),
        });
      }
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
    if (window.location.hash === '#admin') window.location.hash = '';
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
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onOpenLeaderboard={openLeaderboard}
        />
      )}
      {screen === 'exercise' && topicId && (
        <Exercise
          topicId={topicId}
          difficulty={topicId === DAILY_TOPIC_ID ? 'standard' : state.difficulty}
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
      {screen === 'leaderboard' && (
        <Leaderboard lang={state.lang} account={state.account} onBackHome={backHome} />
      )}
      {screen === 'admin' && <Admin onBackHome={backHome} />}
    </main>
  );
}
