# WWM Edu Year 4 curriculum and content audit

Audit date: 2026-09-06  
Release reviewed: v1.5.0

WWM Edu is an independent practice resource. It is not endorsed, approved, or
published by Malaysia's Ministry of Education (KPM) or Examination Board. Topic
alignment below describes the relationship between the app's content and the
referenced curriculum documents; it does not certify complete syllabus coverage.

## Evidence boundary

### Verified requirements and policy

- KPM's launch material says the Malaysian Learning Matrix measures Year 4 and
  Form 3 achievement centrally. It does not give an item-by-item paper format:
  <https://www.moe.gov.my/majlis-peluncuran-rancangan-pendidikan-negara-2026>
- Parliament's official 3 March 2026 record identifies Bahasa Melayu, English,
  Science, and Mathematics as the Year 4 core subjects. It also says Chinese is
  included for SJK(C) pupils as part of the schools' intervention needs, and
  describes the measure as supporting literacy, numeracy, higher-order thinking,
  and earlier targeted support:
  <https://hansard.parlimen.gov.my/hansard/dewan-negara/2026-03-03>
- The KPM-authored KSSR Semakan 2017 Mathematics Year 4 DSKP sets whole-number
  operations within 100,000; fractions, decimals to three decimal places, and
  percentages; money; time; measurement; space; first-quadrant coordinates;
  ratios including 1:1 through 1:10, 1:100, and 1:1000; unitary method; and data
  handling with pictographs and bar charts. The retired BPK download was not
  reliably retrievable during this audit, so the detailed page text was checked
  in this KPM-authored document mirror:
  <https://asiemodel.net/wp-content/uploads/2022/08/DSKP-KSSR-SEMAKAN-2017-MATEMATIK-TAHUN-4.pdf>
- The KPM-authored English SJK Year 4 DSKP aligns Year 4 to A1 High and includes
  understanding main ideas and details in simple one- or two-paragraph texts,
  inferring word meaning from context, and using basic dictionary features. The
  detailed standards were checked in this hosted copy of the KPM document:
  <https://fliphtml5.com/dsymy/vvuy/DSKP_KSSR_Semakan_2017_Bahasa_Inggeris_SJK_Tahun_4/46/>
- The KPM-authored Chinese SJK(C) Year 4 DSKP includes listening and speaking,
  reading, writing, language arts, and language foundations. Its language
  foundations include word meaning and use, classifiers and similar-form or
  polyphonic characters, sentence relationships and connectives, punctuation,
  and recognising the effect of common rhetorical devices. Detailed standards
  were checked in this KPM-authored document mirror:
  <https://asiemodel.net/wp-content/uploads/2022/08/DSKP-KSSR-SEMAKAN-2017-BAHASA-CINA-SJK-TAHUN-4.pdf>

### Inferred practice design

The exact current MPT4 question count, section weights, time limit, marking rules,
and complete item specification were not verified from a current public KPM or
Examination Board document. WWM Edu therefore uses "assessment-style practice"
to mean short, age-appropriate selected-response and numeric items with Malaysian
contexts, functional texts, information retrieval, application, and supported
reasoning. `Standard` and `Advanced` are internal practice tiers, not official
MPT4 bands or KPM performance levels.

## Baseline audit

| Area | Before v1.2.0 | Material finding |
| --- | --- | --- |
| Mathematics | 10 procedural topics | Whole-number and operation ranges could exceed 100,000; a two-step division story used a displayed total inconsistent with its boxes; remainder division could ask an unclear bare equation; coordinates, ratio, unitary method, and data handling were absent. |
| Fractions | Procedural generator | Some displayed choices could be numerically equivalent to the answer, and the simplification explanation incorrectly described dividing by a fraction instead of dividing numerator and denominator by the same factor. |
| English | 245 bank items in four topics | Several tense/preposition clozes lacked enough context, some article/collocation questions admitted alternatives, a vocabulary gloss was inaccurate, some sentence orders allowed another grammatical result, and many explanations merely repeated the answer. |
| Chinese | No subject | There was no Chinese topic, content bank, subject navigation, daily allocation, or upload schema support. |
| Difficulty | Two labels across the app | Some advanced work only increased number size; English topic pools could fall back to the other tier when depleted. |
| Repetition | English ID history and generated IDs | Generated maths could repeat a stem in one session; bank validation did not reject duplicate prompts; static answer positions were highly skewed in legacy English JSON. |
| Validation | Shape checks plus 20,000 maths generations | It did not check semantic fraction equivalence, strict tier selection, complete sessions, three-subject daily composition, stale overrides, or malformed content beyond basic shape. |

## Implemented content and coverage

### Mathematics

Mathematics now has 12 topic cards and all generators remain inside the selected
practice tier. Whole-number and operation values stay within 100,000. The set now
includes patterns, odd/even classification, multi-step contextual operations,
quotient/remainder interpretation, mixed and improper fractions, decimals to
three places, percentage of a quantity, budgeting and payment methods, 12- and
24-hour time, suitable measurement units, angles, parallel/perpendicular lines,
triangle area, solid volume, first-quadrant coordinates, ratio, unitary method,
pictographs, and horizontal bar-chart interpretation.

The strongest remaining mathematics gaps are drawing or constructing graphs and
geometric figures, hands-on estimation, open-ended non-routine solutions, and
live foreign-exchange calculations. Those tasks do not fit the current MCQ and
numeric engine well. Currency questions intentionally avoid current exchange
rates, which would become stale.

### English

Each topic now contains 90 questions: 45 Standard and 45 Advanced, for 360 total.

| Topic | Main coverage |
| --- | --- |
| Grammar | Present and past forms in context, agreement, pronouns, determiners, articles, prepositions, modals, comparatives, conjunctions, possessives, and paired blanks. |
| Vocabulary | Meaning, antonyms and synonyms, collocation, Malaysian contexts, functional vocabulary, guide words, alphabetical order, and phrasal meaning in context. |
| Sentences | Controlled ordering, punctuation and capitals, questions, dialogue, polite functions, notices, linking ideas, sequence, and editing. |
| Comprehension | Main idea, explicit detail, sequence, inference, contextual meaning, notices, posters, timetables, messages, and comparing viewpoints. |

Every retained English item now has a specific bilingual explanation. Assessed
English remains visible in Chinese interface mode so translation does not reveal
the answer. Advanced items add context, inference, editing, or an extra reasoning
step while staying suitable for Year 4 practice.

### Chinese / 华文

Chinese is a full selectable subject in the existing v1.1.1 topic-card design.
It has four banks of 60 questions each, split 30 Standard and 30 Advanced, for
240 total.

| Topic | Main coverage |
| --- | --- |
| 字词运用 | Characters in context, word choice, classifiers, synonyms and antonyms, collocation, idioms, and meaning from context. |
| 句子与标点 | Sentence purpose, punctuation, connectives, `把`/`被`, `的`/`地`/`得`, sentence correction, ordering, clarity, and preserving meaning. |
| 阅读理解 | Fifteen original passages, notices, and functional texts with evidence retrieval, sequence, inference, vocabulary, purpose, comparison, and summary. |
| 习作基础 | Selecting relevant detail, openings and endings, paragraph order, supporting examples, transitions, revision, concision, and proofreading. |

Chinese assessed text remains Chinese in both interface languages. Reading texts
are original. `习作基础` prepares pupils to plan and revise writing through MCQ;
it is not a substitute for producing and receiving feedback on a full composition.

### Session and validation integrity

- Every language session draws ten questions from the requested subject, topic,
  and difficulty only. Choices are shuffled at runtime, removing stored answer-
  position bias.
- Recently served IDs are shared across both language subjects, and a session
  also rejects duplicate normalised prompts.
- Maths sessions retry duplicate stems. Mixed maths schedules different generators
  before repeating a generator.
- The Daily Challenge is deterministic for a given local date and contains four
  Standard maths, three Standard English, and three Standard Chinese questions.
- Pack IDs are namespaced by subject and pack. The validator requires a positive
  integer version, explanations, four unique choices, a valid answer, unique IDs
  and prompts, both tiers, and a subject-safe topic namespace.
- A cached or remote pack with an older version or a mismatched subject/topic can
  no longer replace corrected bundled content.
- The Education content API uses the same full validator as the client for both
  English and Chinese uploads.

## Final audit result

### v1.5 constructed-response and visual follow-up

The app now covers a limited but meaningful part of the previously documented open-response
gap. Three practice studios ask pupils to draft short English and Chinese messages, descriptions,
narratives, explanations, and comparisons, or to show Mathematics reasoning and working. Each
task provides a model response and concrete checklist after the learner writes. The app does not
claim to understand or objectively mark free text: self-checks never enter scores, accuracy,
stars, streaks, badges, leaderboards, mistake review, or weak-area scheduling. Seven conventional
questions remain in each studio session so its objective result is still meaningful.

Visual Mathematics now includes generated bar charts, clocks, angle diagrams, and ruler tasks.
The SVGs use the same typed values as their answers and expose bilingual text alternatives. This
improves interpretation of representations, but it still does not assess pupils drawing their own
graphs or constructions.

All 240 Chinese bank questions received a first-pass internal editorial review for idiomatic
Mandarin, Malaysian school usage, punctuation, answer ambiguity, explanation quality, and Year 4
reading load. The review corrected concrete wording and formatting issues and added automated
guards for the full audited set. It was performed as an internal editorial and technical review;
it is not a credentialed SJK(C) teacher endorsement, and classroom teacher review remains advised.

| Audit dimension | Result | Evidence / limit |
| --- | --- | --- |
| Syllabus/topic coverage | Pass with stated gaps | 12 mathematics topics, four English topics, four Chinese topics, and three response studios cover the major engine-compatible Year 4 strands above. Listening, speaking, handwriting assessment, learner-created diagrams, extended marked compositions, and open investigations remain outside this engine. |
| Language quality | Pass | English ambiguity and explanation fixes were reviewed; Chinese uses simplified Malaysian school contexts and complete Chinese assessed text. Browser checks confirmed readable Chinese passages and feedback. |
| Answer correctness | Pass | 24,000 generator invariant runs plus 7,940 independently recalculated maths answers passed. The check also rejects numerically equivalent fraction answer choices and verifies visual values from their typed source data. |
| Duplication | Pass | No duplicate IDs or normalised prompts within a pack; complete sessions contain ten distinct questions. Deliberate reuse of one reading passage for different skills is retained, but each question stem and answer task is distinct. |
| Difficulty balance | Pass with interpretation boundary | Curated banks total 300 Standard and 300 Advanced. Procedural generators run 1,000 times per topic per tier. Advanced means more context, inference, steps, or larger values within Year 4 limits; it is not an official grade. |
| Assessment suitability | Pass for practice | Functional texts, retrieval, application, reasoning, and explanations support preparation. Exact MPT4 paper structure and marking are not claimed. |
| Technical integrity | Pass | 576 complete language/maths session checks, 31 daily dates, studio composition and unscored-boundary checks, visual accessibility and calculation checks, malformed-pack cases, override precedence, TypeScript, app lint, production build, and browser checks passed. |

The 600 curated questions remain available offline after their subject chunk has loaded. English
and Chinese banks are split into on-demand chunks, so the initial production bundle stays compact
and the build completes without a chunk-size warning.
