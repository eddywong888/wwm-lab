# Thane War II — Development Log

The HD-remastered sequel to Thane War. Same classic RTS rules; a new engine-level
graphics pass and visual identity. Source is private like the original — the site
ships the committed `prebuilt/` bundle (`npm run pack:thane-war-2` from the repo root).

## 2026-07-07 — Native-res buildings + laborer work props

- **Buildings redrawn at native 64×96** (no more 2× upscaling) in the same
  visual language as the new character sprites: 1px outlines, per-pixel
  shading, and storytelling details — tiered shingle roof and brick tower on
  the town hall, portcullis + weapon rack on the barracks, glowing forge and
  ember chimney on the smithy, combed thatch + hay bales on the farm, log
  walls + saw blade on the lumbermill, crenellated watchtower, timber-framed
  goldmine with spilled coins; scaffold matched. Faction theming preserved
  (blue/gold vs red/iron); renderer overlay anchors unchanged.
- **Laborers show their work**: hauling gold now draws a chunky overflowing
  gold stack held in front (facing-aware, occluded correctly when walking
  north); hauling lumber draws a shouldered log at an angle; chopping gets a
  visible axe-swing slash arc + deeper lunge on each chop pulse. All
  render-layer only — the sim is untouched.
- Coded by Gemini 3.1 Pro; verified with in-game close-up screenshots.

## 2026-07-07 — Bitmap character sprites + visible gear tiers

Unit art replaced with characters extracted from an owner-supplied 48×48
fantasy pixel-art sheet. Factions finally look different:

- **Aldermark**: Villager (laborer), armored Footman (spearman), Elven
  Archer (archer), Sorceress (cleric). **Gharok Horde**: Orc Peon, Orc
  Grunt, Troll Headhunter, Goblin Sapper. Catapults keep the original art.
- **Gear tiers (visible!)**: weapon/armor research now changes the sprite —
  normal → elite (steel-blue armor re-shade, brightened weapons) →
  legendary (gold armor, glowing weapons, royal-gold outline). Tier =
  max(weapon, armor) level, baked at extraction time.
- Pipeline: `scripts/extract-sprites.py` (committed) crops the sheet with
  measured grid bands, keys out the checkerboard with a neutral-gray rule
  (keeps the Footman's blue-tinted armor), largest-component + hole-fill
  masking, fits 48×48 feet-anchored, bakes the 3 tiers, and emits raw-RGBA
  base64 into `src/assets/units48.ts` (decoded synchronously at load).
  `spritesheet.ts` serves the full key contract (dirs mirrored from the
  single pose, alt = base, flash silhouettes); corpse/bones/buildings/
  terrain unchanged. Single-file download grew to ~624 kB.
- Built with Gemini 3.1 Pro (integration, tier styling, script skeleton);
  extraction geometry/keying corrected by sighted review after the
  first pass kept caption text and checkerboard remnants.

## 2026-07-07 — Initial release: the HD remaster

Forked from Thane War at feature-complete Phase 4b+ (touch controls, building
repair, shift-select, villager defense, center mine, tower research all included).
All three remaster stages coded by Gemini 3.1 Pro from spec briefs.

- **HD engine**: 32px tiles (was 16), 1280×800 internal canvas (was 960×600).
  The hand-authored 24×24 sprite art is upscaled at spritesheet-bake time with
  a Scale2x/EPX implementation — crisp 48×48 units and 64×96 buildings, with
  relief lighting applied at the upscaled resolution. Procedural terrain
  painters rewritten for 32px tiles (denser grass texture, water depth
  shading, defined road edges). Game logic untouched — positions are in tile
  units, so the sim is identical to Thane War.
- **Particles & game feel**: pooled 512-particle system (zero per-frame
  allocation) — blood on unit hits, death puffs, building rubble bursts,
  wood chips, sparks on building hits, catapult impact dust rings, ambient
  drifting leaves near trees. Render-offset screen shake on catapult impacts
  and building collapses. Smooth render-camera lerp (input still uses the
  exact logical camera). All effects hook the existing GameEvent stream;
  `src/game/` was not modified.
- **Visual identity**: charcoal-navy + royal gold theme via CSS custom
  properties; "THANE WAR II" wordmark in layered text-shadow gold bevel (no
  images — the game stays a single self-contained offline file); gold-trimmed
  translucent HUD panels; restyled title/briefing/game-over screens.
- **Separate persistence**: own IndexedDB (`thanewar2`) and localStorage keys,
  so saves/progress/settings never collide with Thane War on the same origin.
  Own KV counters: `thane-war-2-play` / `thane-war-2-download`.
