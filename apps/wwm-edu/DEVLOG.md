# wwm-edu — DEVLOG

Version log for the KSSR Standard 4 practice app. One entry per shipped release, newest first.
Version scheme: `0.<phase>.<patch>` until the full 4-phase plan is complete, then `1.0.0`.

---

## v1.3.0 — Mistake review and weak-area practice (2026-09-05)

- Results now retain the completed session long enough to show every missed question, the
  learner's answer, the correct answer, and the existing bilingual explanation together.
- Wrong answers feed a local weak-skill queue grouped by topic and difficulty. Results recommends
  the most urgent topics, and Home exposes a review action whenever practice is due.
- Weak-area sessions generate fresh questions from the affected topics instead of replaying the
  same answers. Reaching at least 80% schedules the skill again after one day and then three days;
  a third successful review clears it, while another mistake returns it to immediate practice.
- Review progress is backward-compatible and intentionally local-only; account, leaderboard,
  scoring, question-bank, and remote progress formats are unchanged.
- Added regression checks for queue creation, due-date scheduling, fresh ten-question remediation
  sessions, mastery removal, and reset-on-error behavior.

## v1.2.0 — Year 4 curriculum and three-subject content expansion (2026-09-05)

- Added Chinese / 华文 as a full subject in the existing v1.1.1 subject-tab and
  topic-card design: 字词运用, 句子与标点, 阅读理解, and 习作基础 contain 240 original
  questions, evenly split between Standard and Advanced practice.
- Expanded the four English banks from 245 to 360 questions (45 per tier in each
  topic), repaired ambiguous clozes and sentence ordering, corrected inaccurate
  vocabulary and grammar explanations, and added functional texts, editing,
  inference, dialogue, and dictionary skills.
- Expanded Mathematics from 10 to 12 topics with Coordinates & Ratio and Data
  Handling. Added patterns, odd/even, contextual multi-step reasoning, mixed and
  improper fractions, triangle area, angles, line relationships, payment methods,
  budgeting, measurement-unit suitability, and corrected Year 4 ranges and
  division/fraction defects.
- Updated Daily Challenge to four maths, three English, and three Chinese questions.
  Language sessions now preserve the chosen tier, shuffle choices at runtime,
  namespace IDs, and avoid recently served or duplicate questions; maths sessions
  also prevent duplicate stems.
- Strengthened bundled and KV-upload validation for both language subjects:
  explanations, tier depth, unique prompts/choices, positive versions, topic
  namespaces, and safe override precedence are enforced by shared validation.
- Added `CURRICULUM-AUDIT.md`, separating verified KPM/Parliament curriculum and
  MPT4 policy from inferred practice conventions and documenting remaining engine
  limits. WWM Edu makes no official-endorsement or exact-paper-format claim.
- Verified: `npm run check --prefix apps/wwm-edu` (24,000 generated questions,
  600 curated questions, 576 complete sessions, 31 daily sets, malformed packs,
  and 8,652 independent maths answer recalculations), `npx tsc -b --force`, app
  and Education API lint, app production build, and browser checks of Chinese
  navigation, reading feedback, and multiline data charts.

## v1.1.1 — Main-site return control (2026-09-05)

- Added a persistent back-arrow button to the Education Lab header that returns directly to the
  WWM Lab homepage at `/`, with bilingual accessible text and desktop/mobile interaction states.
- No exercise content, scoring, progress, account, or sync behavior changed.

## v1.1.0 — Learning experience design refresh (2026-09-05)

- **Clearer Home hierarchy** — replaced the flat catalogue opening with a focused learning
  journey: a welcoming Mixed Practice hero, prominent Daily Challenge, compact badge shelf, and
  a dedicated topic browser. Math and English now switch through accessible subject tabs, while
  the existing Standard/Advanced control stays close to the topics it affects.
- **More informative topic cards** — cards now show existing stars and best-streak progress, use
  stronger icon containers and mastery indicators, and retain the original topic names and
  selection behavior. No question banks, generators, scoring thresholds, or saved-data fields
  changed.
- **Focused practice flow** — added topic context, a segmented ten-question progress track, a
  visible exit control, a lightweight owl coach, answer labels, and an integrated feedback/Next
  action. MCQ and numeric-keypad sessions keep their original answer validation and session logic.
- **Cohesive rewards and secondary screens** — Results, Badges, Leaderboard, and Profile now share
  the same cards, typography, elevation, responsive spacing, and interaction states. Results uses
  the existing score, streak, stars, and earned badges; no new reward currency or mechanics were
  introduced.
- **Responsive and accessible polish** — preserved large touch targets, restored Profile access
  in the compact header, added visible keyboard focus, Escape-to-close for the profile dialog,
  dialog semantics, live answer feedback, and a reduced-motion mode via the system preference.
- Verified: `npx tsc -b --force`, `npm run check --prefix apps/wwm-edu` (20,000 generated math
  questions, 245 English questions, badge checks), app-only production build, and interactive
  browser checks at desktop and 390 px mobile widths in English and Chinese.

## v1.0.0 — Phase 4: badges & rewards (2026-09-05)

- **Badge system** — 8 badges × 3 tiers (bronze/silver/gold), 24 achievements total: Topic Master
  (3-star topics), Streak Hero (best streak), Daily Regular (distinct Daily Challenge days),
  Perfect Day (10/10 Daily Challenges), Question Crusher (total attempts), Sharp Shooter (overall
  accuracy, gated at ≥100 attempts so one lucky session can't fake gold), Math Explorer / Word
  Wizard (breadth across math/English topics tried). Catalogue + thresholds live in
  `src/engine/badges.ts`.
- **Derived, not persisted** — the key design decision this phase: `computeBadges(state)` is a
  pure function of the existing `EduState` (`perTopic` + `dailyResults`). No new field was added
  to the localStorage schema, `sanitize()`, or `mergeEduState`, and zero migration was needed for
  existing saved blobs. Because badges are recomputed from data that already syncs across devices
  via Phase 3's progress sync, badges sync for free — there is no separate "unlocked badge ids"
  blob that could ever drift out of sync with a player's actual stats.
  `newlyEarnedBadges(before, after)` diffs two `computeBadges()` snapshots to detect a tier bump
  (including null → bronze) for the Results-screen celebration.
- **UI** — a compact `BadgeShelf` strip on Home (between the difficulty picker and the Daily
  Challenge card) shows up to 6 earned badges plus a count, or a nudge to play if none are earned
  yet; a full `Badges` gallery screen (🎖️ header button) shows all 8 badges with tier-colored
  rings, progress bars toward the next tier, and a MAX marker for gold. Results shows a
  celebration block with a new ascending-arpeggio `playBadgeUnlock()` SFX when a session crosses a
  threshold.
- **Daily Challenge counts toward the aggregate badges** — caught by an independent Codex review
  of the diff. Daily sessions are recorded only in `dailyResults` (`App.tsx`'s `finishExercise`
  calls `recordDailyResult`, never `recordSession`), so the first cut of `totalAttempts` /
  `totalCorrect` / best-streak read `perTopic` alone and a kid who mainly played the Daily
  Challenge would never have advanced Question Crusher, Sharp Shooter or Streak Hero. All three
  metrics now fold the dailies in (one day = one session's worth of questions, using the stored
  best result per date), with regression checks in the sanity script.
- **1.0.0 release flip** — the 4-phase plan (math core, English + Daily Challenge, online backend,
  badges & rewards) is complete; the wwm-edu card on the landing page moved from "in progress" to
  "live". `apps/wwm-edu/package.json` was already at `1.0.0`.
- Verified: `npx tsc -b --force` clean, `npm run check` (20,000 math questions + 4 English packs +
  new badge unit checks: empty state, bronze/gold threshold crossings per badge, the sharp-shooter
  100-attempt gate, and `newlyEarnedBadges` diffing) all passing, full root `npm run build`, and a
  browser check with a seeded localStorage blob (fresh, backward-compat pre-Phase-2 shape, and a
  crossed-threshold session) in both English and Chinese.

## v0.4.0 — Phase 3: online backend (2026-07-11)

- **Accounts** — nickname + 4-6 digit PIN, hashed client-side (SHA-256) into an anonymous
  userKey; no email/PII, restore on any device by re-entering both. Profile UI on Home.
- **Progress sync** — offline-first: localStorage remains source of truth; fire-and-forget
  push after sessions, pull+merge on sign-in (per-topic keep-better rules). App fully
  functional offline/dev with zero console noise.
- **Weekly leaderboard** — 🏆 screen; weekly total = sum of best Daily Challenge score per day,
  top 20 shown, top 50 stored per ISO week. Server validates score range and date (±1 day).
- **Content overrides + admin** — hidden `#admin` page: paste a question-pack JSON, validated
  client- and server-side, stored in KV; packs with new ids appear as new topic cards without a
  redeploy, same-id packs override repo banks. Requires `EDU_ADMIN_KEY` env var (CF dashboard;
  `.dev.vars` locally).
- New Pages Functions: `functions/api/edu/{progress,leaderboard,content}.ts` — all state in the
  existing `VISITS` KV namespace under `edu:user:*` / `edu:lb:*` / `edu:pack:*` keys.
- Verified via `wrangler pages dev` (curl round-trips incl. 400/401/413 guards, best-per-day
  dedupe) + full browser flow (account → daily → leaderboard, admin upload/delete).

## v0.3.0 — Phase 2: English subject + Daily Challenge (2026-07-11, commit `1d39348`)

- **English subject** — four curated question banks (`src/content/english/`): Grammar (65),
  Vocabulary (60), Sentences (60), Comprehension (60) = 245 questions at KSSR S4 / CEFR A1-A2
  level, each with standard/advanced tiers. Pack schema + dependency-free runtime validator in
  `src/content/schema.ts`.
- **Anti-repeat sampling** — the app remembers the last ~200 served English question ids
  (localStorage) so daily practice doesn't recycle questions.
- **Daily Challenge** — date-seeded session (7 math + 3 English, always standard tier), identical
  for every player on a given local date; best-of-day score stored and shown on the Home card.
- **Content QA** — all 245 questions reviewed by Gemini 3.1 Pro for ambiguity/level; 6 fixed
  (two-defensible-answer items like "at/on the weekend", "Take/Have a shower"; one over-level
  choice phrase). 5 flagged items kept deliberately as advanced-tier stretch content.
- Sanity script extended to validate every pack (≥60 questions, unique ids, answer ∈ choices).
- Old localStorage blobs load unchanged (new fields optional with safe defaults).

## v0.2.0 — Second-half-year math topics (2026-07-10, commit `2e80385`)

- Six new procedural generators completing the KSSR S4 DSKP year: 🍕 Fractions, 🔟 Decimals,
  💯 Percentages, ⏰ Time, 📏 Measurement (length/mass/volume), 📐 Shapes
  (perimeter/area/volume) — each bilingual with standard + advanced tiers.
- `GeneratorMeta.term` tag (1 | 2); Home topic grid grouped into "First Half Year / 上半年" and
  "Second Half Year / 下半年" sections. Mixed Practice spans all 10 topics.
- Sanity coverage now 20,000 generated questions per run (10 generators × 1000 × 2 difficulties).
- Site: Education Lab section moved above Lab Experiments on the landing page.

## v0.1.0 — Phase 1: Math core (2026-07-10, commit `9a72010`)

- New public-source sub-app at `/apps/wwm-edu/` (React 19 + Vite + TS, modeled on memory-card).
- Seeded-RNG question engine (mulberry32) with four generators: Whole Numbers, Addition &
  Subtraction, Multiplication & Division, Money (RM) — computed answers, common-student-error
  MCQ distractors, bilingual EN/简体中文 prompts, standard + advanced tiers.
- 10-question sessions: MCQ buttons + numeric on-screen keypad, immediate feedback with worked
  explanations, streak 🔥 counter, results screen with stars.
- Procedural WebAudio sound effects (mutable), kid-friendly responsive UI.
- localStorage progress (`wwm-edu:v1`): per-topic attempts/correct/best-streak/stars.
- Generator sanity script (`npm run check`) — 8,000 questions per run at launch.
- Landing page gained the "Education Lab" section; root build includes the app.
- Post-review fix: numeric answers compare by value, not string ("25" counts for "25.00").

---

## Planned

- **v0.4.0 — Phase 3 (in progress):** nickname + PIN accounts, online progress sync (KV),
  weekly leaderboard from Daily Challenge scores, KV content-override packs + hidden `#admin`
  upload page. Requires `EDU_ADMIN_KEY` env var in the Cloudflare Pages dashboard for admin
  uploads.
- **v0.5.0 — Phase 4:** polish — mascot/feedback animations, badges & streak rewards, more
  advanced-tier content, accessibility audit; landing card flips from "in progress" to "live".
