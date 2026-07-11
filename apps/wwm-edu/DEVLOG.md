# wwm-edu — DEVLOG

Version log for the KSSR Standard 4 practice app. One entry per shipped release, newest first.
Version scheme: `0.<phase>.<patch>` until the full 4-phase plan is complete, then `1.0.0`.

---

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
