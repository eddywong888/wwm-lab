# Thane War — Development Log

A running record of what shipped, when, and what's next. Newest first.
Commits reference this repo's `main` branch; the playable build lives at
`/apps/thane-war/` and updates automatically on push via Cloudflare Pages.

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
