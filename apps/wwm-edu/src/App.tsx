import { useEffect, useState } from 'react';
import './App.css';
import Home from './screens/Home';
import Exercise from './screens/Exercise';
import Results from './screens/Results';
import Leaderboard from './screens/Leaderboard';
import Badges from './screens/Badges';
import Admin from './screens/Admin';
import { getDueReviewSkills, loadState, updateState, recordSession, recordDailyResult, recordReviewProgress } from './store/local';
import type { AnswerRecord, Difficulty, Lang, Question, Subject } from './engine/types';
import { unlockAudio } from './audio/sfx';
import { DAILY_TOPIC_ID, generateReviewSession, MIXED_TOPIC_ID, REVIEW_TOPIC_ID, scoredSessionAnswers, todayDateString } from './engine/session';
import { pushProgress, pushLeaderboard } from './store/sync';
import { signIn, signOut } from './store/account';
import { ensureAllLanguageContent, ensureSubjectContent, isChineseTopic, isEnglishTopic, refreshEnglishContent } from './engine/english';
import { computeBadges, newlyEarnedBadges, type EarnedBadge } from './engine/badges';
import { t, UI_STRINGS } from './engine/i18n';
import { constructedSubject, ensureConstructedContent, isConstructedTopic } from './engine/constructed';

type Screen = 'home' | 'exercise' | 'results' | 'leaderboard' | 'admin' | 'badges';

function screenFromHash(): Screen {
  return window.location.hash === '#admin' ? 'admin' : 'home';
}

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [screen, setScreen] = useState<Screen>(() => screenFromHash());
  const [topicId, setTopicId] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [lastResult, setLastResult] = useState<{ answers: AnswerRecord[]; correct: number; total: number; bestStreak: number } | null>(null);
  const [newBadges, setNewBadges] = useState<EarnedBadge[]>([]);
  const [reviewQuestions, setReviewQuestions] = useState<Question[] | null>(null);
  const [contentStatus, setContentStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  // Hash-based route for the hidden admin content-override page — never
  // linked from any UI, reachable only by visiting #admin directly.
  useEffect(() => {
    function onHashChange() {
      setScreen(screenFromHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = state.lang === 'zh' ? 'zh-Hans' : 'en';
  }, [state.lang]);

  useEffect(() => {
    if (state.subject !== 'math') {
      void ensureSubjectContent(state.subject).catch(() => setContentStatus('error'));
    }
  }, [state.subject]);

  // Content overrides (Phase 3 KV packs) and, if already signed in,
  // server progress — both fire-and-forget, the app works fully offline.
  useEffect(() => {
    void refreshEnglishContent().then((updated) => { if (updated) setState(loadState()); });
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

  function changeSubject(subject: Subject) {
    setState(updateState({ subject }));
    if (subject !== 'math') {
      void ensureSubjectContent(subject).catch(() => setContentStatus('error'));
    }
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

  async function prepareTopicContent(id: string): Promise<boolean> {
    const needsBoth = id === MIXED_TOPIC_ID || id === DAILY_TOPIC_ID;
    const studio = isConstructedTopic(id);
    const studioSubject = constructedSubject(id);
    const subject = isEnglishTopic(id) ? 'english' : isChineseTopic(id) ? 'chinese' : studioSubject === 'english' || studioSubject === 'chinese' ? studioSubject : null;
    if (!needsBoth && !subject && !studio) return true;
    setContentStatus('loading');
    try {
      // Studio banks are lazily chunked too — load them alongside the bank the
      // studio's seven marked questions come from.
      if (studio) await ensureConstructedContent();
      if (needsBoth) await ensureAllLanguageContent();
      else if (subject) await ensureSubjectContent(subject);
      setContentStatus('idle');
      return true;
    } catch {
      setContentStatus('error');
      return false;
    }
  }

  async function selectTopic(id: string) {
    if (!await prepareTopicContent(id)) return;
    unlockAudio();
    setReviewQuestions(null);
    setTopicId(id);
    setSessionKey((k) => k + 1);
    setScreen('exercise');
  }

  function openLeaderboard() {
    setScreen('leaderboard');
  }

  function openBadges() {
    setScreen('badges');
  }

  function finishExercise(answers: AnswerRecord[], bestStreak: number) {
    const scoredAnswers = scoredSessionAnswers(answers);
    const correctCount = scoredAnswers.filter((answer) => answer.correct).length;
    const totalCount = scoredAnswers.length;
    const badgesBefore = computeBadges(state);

    if (topicId === DAILY_TOPIC_ID) {
      recordDailyResult(todayDateString(), correctCount, bestStreak);
    } else if (topicId && topicId !== REVIEW_TOPIC_ID) {
      recordSession(topicId, correctCount, totalCount, bestStreak);
    }
    const nextState = recordReviewProgress(scoredAnswers, topicId === REVIEW_TOPIC_ID);
    setState(nextState);
    setNewBadges(newlyEarnedBadges(badgesBefore, computeBadges(nextState)));

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

    setLastResult({ answers, correct: correctCount, total: totalCount, bestStreak });
    setScreen('results');
  }

  async function practiceWeakAreas() {
    const skills = getDueReviewSkills(state);
    setContentStatus('loading');
    try {
      await Promise.all([
        skills.some((skill) => isEnglishTopic(skill.topicId)) ? ensureSubjectContent('english') : Promise.resolve(),
        skills.some((skill) => isChineseTopic(skill.topicId)) ? ensureSubjectContent('chinese') : Promise.resolve(),
      ]);
      setContentStatus('idle');
    } catch {
      setContentStatus('error');
      return;
    }
    const questions = generateReviewSession(skills);
    if (questions.length === 0) return;
    unlockAudio();
    setReviewQuestions(questions);
    setTopicId(REVIEW_TOPIC_ID);
    setSessionKey((key) => key + 1);
    setScreen('exercise');
  }

  function retrySameTopic() {
    if (topicId === REVIEW_TOPIC_ID) {
      void practiceWeakAreas();
      return;
    }
    setSessionKey((k) => k + 1);
    setScreen('exercise');
  }

  function backHome() {
    setTopicId(null);
    setReviewQuestions(null);
    if (window.location.hash === '#admin') window.location.hash = '';
    setScreen('home');
  }

  return (
    <main className="app" onPointerDownCapture={unlockAudio} aria-busy={contentStatus === 'loading'}>
      {contentStatus !== 'idle' && (
        <div className={`app__content-status app__content-status--${contentStatus}`} role={contentStatus === 'error' ? 'alert' : 'status'}>
          {t(contentStatus === 'loading' ? UI_STRINGS.loadingPractice : UI_STRINGS.loadingPracticeError, state.lang)}
        </div>
      )}
      {screen === 'home' && (
        <Home
          state={state}
          onChangeLang={changeLang}
          onChangeDifficulty={changeDifficulty}
          onChangeSubject={changeSubject}
          onSelectTopic={selectTopic}
          onMuteChange={handleMuteChange}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onOpenLeaderboard={openLeaderboard}
          onOpenBadges={openBadges}
          dueReviewCount={getDueReviewSkills(state).length}
          onPracticeWeakAreas={practiceWeakAreas}
        />
      )}
      {screen === 'exercise' && topicId && (
        <Exercise
          topicId={topicId}
          difficulty={topicId === DAILY_TOPIC_ID ? 'standard' : state.difficulty}
          lang={state.lang}
          onFinish={finishExercise}
          onBackHome={backHome}
          sessionKey={sessionKey}
          questionsOverride={topicId === REVIEW_TOPIC_ID ? reviewQuestions ?? undefined : undefined}
        />
      )}
      {screen === 'results' && lastResult && (
        <Results
          lang={state.lang}
          correctCount={lastResult.correct}
          totalCount={lastResult.total}
          bestStreak={lastResult.bestStreak}
          newBadges={newBadges}
          answers={lastResult.answers}
          weakAreas={getDueReviewSkills(state)}
          isReview={topicId === REVIEW_TOPIC_ID}
          onPracticeWeakAreas={practiceWeakAreas}
          onRetry={retrySameTopic}
          onBackHome={backHome}
        />
      )}
      {screen === 'leaderboard' && (
        <Leaderboard lang={state.lang} account={state.account} onBackHome={backHome} />
      )}
      {screen === 'badges' && (
        <Badges lang={state.lang} state={state} onBackHome={backHome} />
      )}
      {screen === 'admin' && <Admin onBackHome={backHome} />}
    </main>
  );
}
