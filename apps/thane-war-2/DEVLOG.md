# Thane War II — Development Log

The HD-remastered sequel to Thane War. Same classic RTS rules; a new engine-level
graphics pass and visual identity. Source is private like the original — the site
ships the committed `prebuilt/` bundle (`npm run pack:thane-war-2` from the repo root).

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
