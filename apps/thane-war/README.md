# Thane War: Shadow of the Horde

A retro real-time strategy game (canvas + WebAudio, no external assets).

Development history and roadmap: see [DEVLOG.md](./DEVLOG.md).

**The game source (`src/`) is intentionally not committed** — it lives only on the
development machine. The public site serves the compiled bundle committed under
`/prebuilt`:

- `prebuilt/apps/thane-war/` — the live game at `/apps/thane-war/`
- `prebuilt/downloads/thane-war.html` — self-contained single-file download
  (all JS/CSS inlined; runs offline straight from `file://`)

## Rebuilding after source changes

```sh
npm run pack:thane-war   # from the repo root
```

This builds the app, refreshes `prebuilt/apps/thane-war/`, and regenerates the
single-file download. Commit the `prebuilt/` changes to deploy.

The root `npm run build` (used by Cloudflare Pages) does **not** need the game
source — it just copies `prebuilt/` into `dist/`.

## Local development

The source must be present at `apps/thane-war/src/`. The root dev server
(`npm run dev`) serves the game with hot reload at `/apps/thane-war/`.
