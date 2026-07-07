# Thane War — Development Log

A running record of what shipped, when, and what's next. Newest first.
Commits reference this repo's `main` branch; the playable build lives at
`/apps/thane-war/` and updates automatically on push via Cloudflare Pages.

## 2026-07-07 — Refinement batch II: shift-select, villager defense, center mine, tower research

Four quality-of-life/balance features, all coded by Gemini 3.1 Pro from spec
briefs (via the Antigravity CLI) and verified in-browser by the main session.

- **Shift-select**: Shift+click or Shift+drag ADDS units to the current
  selection (dedup, 12 cap) instead of replacing it; shift-clicking an
  already-selected unit removes it. Shift+1-9 appends the selection to that
  control group (Ctrl+digit still assigns, digit still recalls).
- **Villager self-defense**: a villager hit in melee while idle or walking
  now fights back (their existing 3-damage attack); villagers busy
  harvesting/building/repairing are never interrupted. `dealDamage` gained
  an optional attacker param, threaded from the melee hit site only —
  projectiles carry no source. Explicit attack-move (A) works for villagers.
- **Contested center mine**: every random skirmish map now has a third
  public gold mine at the map center (30,31) on a deterministic 9×9
  clearing — both sides' workers will use it; fight for it.
- **Tower Fortification**: new smithy research (hotkey T, 🗼): +4 tower
  damage and +1 range per level, two levels (150g/150l then 300g/250l).
  Player-only — the AI doesn't research it. Old saves load fine
  (towerLevel defaults to 0 on hydration).

## 2026-07-07 — Building repair

Villagers can now repair damaged friendly buildings, WC2-style.

- Right-click a damaged, completed friendly building with workers selected
  → new `repair` unit state (`game/units.ts updateRepair`): walk adjacent,
  hammer (same cadence/animation as construction), restore 2 hp per tick.
- **Cost**: a full 0→max repair costs 50% of the building's build cost,
  charged smoothly via fractional gold/lumber accumulators on the player;
  if the stockpile can't cover the next whole coin, the repair pauses
  (worker keeps hammering, no hp, no charge) and resumes when resources
  arrive. Worker idles when the building reaches full hp or vanishes.
- Player-only for now; the AI is untouched (verified: 2500-tick fast-forward
  still completes all enemy buildings and spawns attack waves).
- Implemented by Gemini from a spec brief; verified in-browser: 300 hp
  town-hall repair cost exactly 120g/75l (= 0.5 × 400g/250l × 300/500).

## 2026-07-07 — Phase 4b refinement: touch controls (tablet-first)

The game now plays on touch screens. Additive touch layer on top of the
existing mouse/keyboard input — desktop behavior unchanged.

- **Gestures** (`engine/input.ts`): tap = select / confirm placement / issue
  armed order; one-finger drag past 9 CSS px = camera pan; 350ms stationary
  long-press = context order (the right-click equivalent: move/attack/
  harvest); two-finger drag always pans, with anchor re-baselining on 1↔2
  finger transitions so the camera never jumps. Thresholds measured in
  client (CSS) pixels, not canvas pixels, so they survive letterbox scaling.
  Synthetic mouse events after touch are suppressed (preventDefault + a
  500ms guard in `onMouseDown`).
- **Box select**: ⛶ toggle button overlaying the viewport (rendered only
  when `(pointer: coarse)` matches); arms the next one-finger drag to drive
  the existing marquee instead of panning, auto-disarms after use.
- **Minimap** (`engine/minimap.ts`): tap = camera jump (or issue an armed
  order), drag = scrub, long-press = context order.
- **Mobile hardening**: viewport meta `user-scalable=no` + `viewport-fit=
  cover`, `touch-action:none` + `user-select:none` on both canvases,
  `overscroll-behavior:none`, iOS `gesturestart` preventDefault, and a
  `(pointer: coarse)` media block bumping command/footer buttons to 40px.
- Built collaboratively: Gemini reviewed the gesture design and the diff
  (caught a stuck `drag.active` when a second finger interrupts box-select),
  a Sonnet agent implemented, verified via Playwright touch emulation
  (tap/pan/long-press/two-finger/box-select + full mouse regression).
- Also closed the pending 4b verification: an existing Mission 5 save loads
  cleanly ("Continue" restores units/buildings/resources, sim runs on).

## 2026-07-06 — Phase 4b: saves, random skirmish, mine limits (`2c9eb05`)

(Entry added retroactively — missed in the original commit.)

- Mid-mission **save/load** via IndexedDB (`utils/saves.ts`): one slot per
  mission, autosave every 1500 ticks, cleared on game over; briefing screen
  offers "Continue" when a save exists.
- **Random skirmish maps**: `makeSkirmish(seed)` + mapgen helpers.
- **Gold mine occupancy limits** and crash hardening.

## 2026-07-05 — Phase 4a: siege, healers, difficulty

- **Catapult** (`'catapult'`, Gharok: "Skull Lobber"): siege unit trained at the
  Barracks (hotkey C), gated on a completed **Smithy** — same pattern as the
  archer/lumbermill gate, enforced in `game.train`, the CommandCard button
  lock+hint, and the AI's wave training. Stats: 50 hp, speed 0.3, 24 dmg,
  range 6, cooldown 25, 300g/200l, 140 train ticks. Shots are big slow rocks
  (`Projectile` gained optional `splash`/`size` fields; catapult shots fly at
  0.55 with splash 1.6): on impact the direct target takes full damage and
  every OTHER enemy *unit* within the splash radius takes 50% (rounded);
  buildings only ever take the direct hit, own units are never harmed
  (`updateProjectiles` in combat.ts). New SFX `catapultFire` (low 90Hz square
  thunk + noise) and `rockHit` (heavy 400Hz crash + low saw), picked
  kind-aware in `spawnProjectile` — archer sounds untouched. Art: authored
  S/N/E 24x24 frames (wheel pair, wooden frame, throwing arm with `b` metal
  fittings and an `m` bucket, team pennant); it has no legs, so
  spritesheet.ts bakes its `_alt` walk frames as the same pose.
- **Cleric** (`'cleric'`, Gharok: "Bone Shaman"): support healer trained at
  the Barracks (hotkey E), gated on a completed Lumber Mill. Stats: 35 hp,
  speed 0.5, 2 dmg melee, 140g, 100 train ticks. No mana: when idle or
  attack-moving, a cleric seeks the nearest injured friendly unit in sight
  (new `game/heal.ts`), paths within 1.5 tiles, and mends +3 hp per 10 ticks
  (cooldown doubles as the heal timer, `attackedAt` gives a cast pose).
  Each pulse emits sfx `heal` (soft two-note triangle chime) and a new
  `{ t:'healed' }` GameEvent that the renderer turns into 3-4 rising green
  motes (`spawnHeal`, #78e878/#b8f0b8). Clerics are excluded from
  `autoAcquire` so they never pick fights, but an explicit attack order still
  works (feeble 2 dmg, no special-casing). Art: hooded robe in team colors
  with a `b`-tipped staff; the robe hides the legs, so its walk `_alt`
  frames are also baked as the same pose (side views keep the renderer bob).
- **Difficulty (Easy/Normal/Hard)**: chosen on the briefing screen (three
  buttons, both campaign and skirmish), default = last used, persisted in a
  new `thanewar_settings` localStorage key (separate from `thanewar_progress`
  so old saves are untouched). Applied at Game construction via
  `applyDifficulty()` in mission.ts, which **deep-copies** the enemy config —
  MissionDef singletons are never mutated. Easy: enemy gold/lumber x0.6 and
  wave counts ceil(x0.7); Hard: x1.5 / ceil(x1.4) and the AI's
  smithy-research start tick drops 2500→1500 (now an `AIState` field).
  The chosen difficulty shows on the briefing (selected button state) and as
  a small label chip in the ResourceBar next to the objective.
- **Campaign integration**: M3 adds `'cleric'` to allowedUnits (M2
  unchanged; M4/M5 omit allowedUnits so everything incl. catapult is
  allowed — verified absence means allowed). M4's late waves add clerics;
  M5's late waves add catapults+clerics; skirmish's final wave adds 1
  catapult. The AI gates cleric on its lumbermill and catapult on its smithy
  (both prebuilt in M4/M5/skirmish-late). Wave army maps list
  catapult/cleric FIRST: the AI trains armies in key order and can stall at
  its pop ceiling partway down the list, which would otherwise starve the
  new kinds out (verified in-sim: with them first, the freed-pop queue slot
  goes to a catapult/cleric before more spearmen).
- Exhaustive-map sweeps for the new kinds: UNIT_PLURAL (game.ts), UNIT_ROLES
  (SelectionPanel), train hotkey/lock maps (CommandCard), spritesheet `kinds`
  array (icons derive automatically), and the renderer's per-kind maxHp map
  replaced with `UNIT_DEFS[u.kind].hp`. Verified via Playwright: tech-gate
  messages before/after smithy+lumbermill (including re-locking after the
  smithy was razed), splash numbers (24 direct to a building, 12 to each
  clustered unit), heal climb 5→41 hp with 12 `healed` events, Hard=1.5x /
  Easy=0.6x enemy gold with persistence across reloads, 4 iconed train
  buttons on the barracks card, M1 train-objective flow to victory, and an
  M5 6000+-tick fast-forward with zero exceptions.

## 2026-07-05 — Minimap orders & richer HUD

- **Minimap move/attack orders**: right-clicking the minimap now issues the
  same context order as right-clicking the main map — `Minimap` converts the
  click's pixel position to a world tile (accounting for the canvas's CSS
  scaling, the same way `Input.toCanvas` does) and calls `game.rightClick(x,
  y)`; the browser context menu is suppressed on the minimap canvas. If a
  move/attack-move order is armed (M/A hotkey), a plain left-click on the
  minimap issues it via `game.issuePendingOrder(x, y)` instead of panning the
  camera. Plain left-click/drag still recenters the camera as before.
- **HUD art pass**: replaced the emoji-and-text HUD with real game art. New
  `hud/icons.ts` module scales the existing procedural sprites (from
  `buildSprites()`, initialized once via `initIcons(sprites)` in
  `GameScreen`) into crisp upscaled `<img>` dataURLs — unit icons/portraits,
  building icons — plus three small hand-drawn resource glyphs (gold pile,
  log, wheat sheaf) drawn directly with canvas primitives. `ResourceBar` now
  shows icon+number chips instead of emoji; `SelectionPanel` shows a framed
  unit/building portrait next to name/HP for single selection, and small
  unit-icon chips with 2px HP slivers for multi-selection; `CommandCard`
  build/train buttons show the actual building/unit art instead of 🔨/⛏/🗡/🏹
  (research buttons keep their emoji, per plan). The sidebar got subtle
  panel framing (Map / Selection / Commands section headers) and grew to
  220px to fit portraits comfortably; the mini title got a gold underline.
  Verified via Playwright: portraits/icons render with non-empty `<img>`
  src, campaign M1 and skirmish both still load and simulate cleanly, and a
  sidebar screenshot confirms the new layout reads as distinct, aligned
  panels.

## 2026-07-05 — Phase 3 — Campaign

- **5-mission campaign**: a full Aldermark-vs-Gharok story arc from muster
  field to the Horde's own war camp, replacing the single skirmish as the
  primary way to play (skirmish stays as free play). Each mission has its
  own deterministically-generated map (unique seed, size, and terrain
  mix — from M1's small, safe 40×40 muster field to M5's sprawling 64×64
  final battlefield), a tailored enemy AI (economy, build order, wave
  schedule), and 2-3 paragraphs of briefing text continuing the story.
  Difficulty escalates mission to mission: M1 "Mustering Ground" (train an
  army, no threat), M2 "Hold the Crossing" (defensive, survive a wave
  gauntlet at a river ford), M3 "Timber and Steel" (destroy a fortified
  outpost, smithy unlocked), M4 "The Vanguard" (full tech, larger base,
  4 waves), M5 "Shadow of the Horde" (finale — a rich two-goldmine enemy
  base and an aggressive 6-wave schedule).
- **New objective types**: the objective engine (`game.ts` / `mission.ts`)
  now supports `survive` (hold out until a tick count) and `trainUnits`
  (raise N of a given unit) alongside the original `destroyAllEnemies`.
  Victory requires every objective on the mission to be satisfied at once;
  annihilation is still an instant loss regardless of mission type. A
  compact objective line now renders in the resource bar — a live
  mm:ss countdown for survive missions, an X/Y counter for training
  objectives, or a short destroy-target label.
- **Per-mission tech gating**: `MissionDef` gained optional
  `allowedBuildings` / `allowedUnits` lists (absent = everything unlocked).
  Early missions restrict the tech tree to match the story (M1: town hall/
  farm/barracks/spearman/laborer only; M2 adds lumber mill, archer,
  watchtower; M3 adds the smithy; M4/M5 and skirmish are unrestricted).
  Gating is enforced in the simulation itself (`startPlacing`,
  `confirmPlacement`, `train`) rather than only in the UI, so hotkeys and
  direct calls can't bypass it; the command card also disables locked
  entries with a "Not unlocked in this mission" hint.
- **Mission select & flow**: a new mission-select screen lists all five
  missions, unlocking each one as the previous is completed (persisted in
  the existing `thanewar_progress` localStorage key) and marking finished
  missions with a check. The title screen now offers Campaign or Skirmish;
  briefing rendering is shared between both modes. On victory, the game-
  over overlay offers a "Next mission" button straight into the next
  briefing (or "Back to missions" on the finale); on defeat it offers
  Retry or Back to missions. Skirmish keeps its original Play again/Title
  screen buttons.
- **Procedural background music**: a short chiptune loop (square-wave
  melody, triangle bass, soft noise percussion, ~8 bars) now plays at low
  volume during missions, scheduled with a lookahead AudioContext
  scheduler so timing stays tight. It shares the existing SFX
  AudioContext, starts on the Begin click (first user gesture), and
  respects both the existing 🔊 sound mute and a new independent 🎵 music
  toggle in the sidebar (both persisted in localStorage).
- Simplified: M5's "AI already researches" late-wave flavor relies on the
  existing scripted smithy-research AI (well-funded, pre-built smithy)
  rather than new plumbing to seed starting tech levels — by the later
  waves the Horde has naturally researched its way to Veteran/Elite ranks.
  No mid-mission saves, orc campaign, new unit kinds, or map editor were
  added — all explicitly out of scope for this phase.

## 2026-07-05 — Rank titles, visible mine gold, worker-built construction

- **Rank titles**: smithy research now shows on unit names, not just stats —
  Trained / Veteran / Elite / Legendary prefixes stack with combined weapon
  + armor levels (0-4 total), for every unit kind on both factions.
- **Gold mines show their gold**: selecting a mine reports remaining gold
  in the panel, and the sprite now has a pile of ore spilling out of the
  dark entrance so a near-empty mine is visible at a glance.
- **Villagers build buildings**: Laborers are renamed Villagers (Aldermark
  only — Gharok keeps Toiler; the internal unit id is unchanged) and
  construction is no longer self-driven. Placing a building sends the
  selected workers to walk over and hammer on it (with a new hammer SFX);
  progress only advances while a worker is actually adjacent, so pulling
  the builder away mid-job freezes the site until someone resumes it via
  right-click. The scripted AI now steals a worker for each build-order
  building too, with a periodic re-check so a building that missed its
  initial assignment (all workers busy) still eventually gets one instead
  of stalling forever.

## 2026-07-05 — HD update: 960×600, baked lighting, richer animation

- **Resolution** raised from 640×400 to 960×600 — ~50% more battlefield on
  screen, crisper at fullscreen. Still 60 fps.
- **Baked relief lighting** on every sprite: vertical sky-light ramp plus
  lit top edges / shaded bottom-right contours give buildings and units
  fake-3D volume.
- **Terrain relief**: broad light/shade patches roll across the ground;
  open water shimmers between wave frames; corner vignette adds depth.
- **Animation**: real second stride frames for east/west walking (legs
  actually pass now), idle units breathe with a slow desynced bob, unit
  shadows are soft radial gradients, and construction sites hoist a
  bobbing crane load.

## 2026-07-05 — Rally points, living buildings, voice barks

- **Rally points**: select a production building and right-click the ground —
  a fluttering flag marks the spot and newly trained units walk there.
- **Building animation**: banners flutter, the smithy forge breathes orange
  light and its chimney ember blinks, the lumber mill saw glints as it spins,
  the watchtower fire flickers, gold veins twinkle; buildings also cast a
  soft east-side shadow for depth.
- **Voice-style acknowledgments**: chiptune barks distinguish workers
  ("hm?" / "okey-doke") from soldiers ("sir!" / "hup!"), with an aggressive
  battle shout on attack orders and random detune so barks vary.

## 2026-07-05 — Command hotkeys, unit stat panel, group badges

- **Keyboard commands**: with units selected — M move, A attack-move,
  S stop (M/A arm the order; next left-click issues it). With a worker
  selected — R road, F farm, B barracks, L lumber mill, K smithy,
  W watchtower, H town hall. Buildings: L laborer (Town Hall),
  S spearman / A archer (Barracks), W weapons / D armor (Smithy).
  All command-card buttons show their hotkey.
- **Selection info**: the panel now shows a stat block for units — damage
  (including weapons research), armor, range, sight — plus a role line
  ("Worker — builds, mines gold, chops lumber"); buildings describe what
  they provide (food, drop-off, tower damage/range).
- **Group badges**: units and buildings assigned to a control group wear a
  small numbered tag on the battlefield.

## 2026-07-05 — Graphics push III: tall buildings & living scenery (`9415215`)

- All 7 building types redrawn at **32×48** with a 16px overhang above the
  2×2 footprint — crenellated barracks keep, ember-topped smithy chimney,
  saw-gable lumber mill, and a Watchtower that finally looks like a tower.
- Buildings and units merged into a single **y-sorted draw pass**: units
  walking behind a tall structure are occluded by its roofline.
- Farm and Smithy chimneys puff drifting smoke particles.
- Grass tiles seeded with sparse wildflowers and pebbles.
- Scaffold redrawn taller with a hoist crane.

## 2026-07-05 — Graphics push II: 24×24 units (`3be5c47`)

- Units re-authored at **24×24** (from 16×16), feet anchored to the tile so
  they stand ~1.5 tiles tall like the mid-90s classics.
- Laborer: hooded peasant with shouldered axe. Spearman: full helm,
  team-colored round shield, full-length spear (leveled when side-facing).
  Archer: studded tunic, curved bow, back quiver with steel arrow tips.
- Corpse/bones death stages redrawn to match.

## 2026-07-05 — Visible gear, chop animation, crowd pathing (`56ff170`)

- **Research shows on units**: 9 gear-tier sprite variants per unit —
  weapons steel → gleaming → gilded (Horde: dark iron → honed → smoldering
  red); armor steel → polished → gold-trimmed (Horde: crude → banded →
  blood-lacquered). Applies to the enemy too, so wave strength is readable.
- Chopping is animated: axe swings with wood-chip particles; carried loot
  is a gold sack / shouldered log.
- Pathing fix: units blocked by other units now stop adjacent when the
  destination itself is occupied, or detour around standing units — no more
  workers idling in traffic jams.

## 2026-07-05 — Phase 2: tech buildings & control groups (`7ab5926`)

- **Lumber Mill** — second lumber drop-off; required to train Archers.
- **Smithy** — research Forged Weapons (+2 dmg/level) and Tempered Armor
  (−1 dmg taken/level), two levels each.
- **Watchtower** — defensive structure that shoots the nearest enemy.
- **Control groups** — Ctrl/Cmd+1–9 assigns, digit recalls, double-tap
  centers the camera.
- Enemy AI builds all of the above, gates its archers on its own mill, and
  researches upgrades from mid-game.

## 2026-07-04 — Play/download analytics (`a6486f8`)

- Cloudflare KV counters via Pages Functions: `thane-war-play` (once per
  session, real site only) and `thane-war-download` (counted at the
  `/downloads/thane-war` route). Stats visible at `/api/hits`.

## 2026-07-04 — Phase 1 release (`a0dab99`)

The initial playable skirmish, built in one long session:

- **Engine**: Canvas 2D at 640×400 (pixel-scaled), fixed 10 Hz simulation
  with interpolated 60 fps rendering; A* pathfinding on a 64×64 tile map;
  fog of war (unexplored / shroud / visible); minimap with click-to-jump.
- **Classic rules**: road-adjacency building placement, farm-based pop cap,
  gold mining round-trips, tree chopping with deforestation.
- **Combat**: melee + ranged with projectiles, attack-move, HP bars,
  staged deaths (fall → corpse → bones).
- **Content**: Aldermark vs Gharok Horde skirmish with a scripted AI
  (economy, build order, 4 escalating attack waves, base defense).
- **Audio**: procedural WebAudio chiptune SFX, no asset files.
- **Distribution**: source kept private; site serves a committed prebuilt
  bundle plus a self-contained single-file offline download (~84 KB gzipped).

## Roadmap

- **Phase 2 leftovers**: worker-built construction (buildings currently
  self-construct), siege unit, healer, gold mine occupancy limit, leaner
  unit proportions.
- **Phase 3 — campaign**: 5-mission human campaign with briefings, mission
  select, objectives and tech gating; chiptune music loop; mid-mission
  saves (IndexedDB); orc campaign as a stretch goal.
