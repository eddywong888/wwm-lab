# AGENTS.md — wwm-lab

This file provides context for AI agents (Claude Code, Gemini CLI / agy, etc.) working in this repository.

## Project Overview

**wwm-lab** is Eddy Wong's personal lab — a living site for browser games, web experiments, SEO/GEO research, and monetization ideas. The goal is to ship small things fast, learn from real traffic, and build toward a sustainable online presence.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Plain CSS (no UI libraries) |
| Hosting | Cloudflare Pages (auto-deploy from `main`) |
| Backend | Cloudflare Pages Functions (`functions/api/`) |
| Storage | Cloudflare KV (`VISITS` namespace — visitor counter) |
| Fonts | JetBrains Mono (display) + DM Sans (body) — loaded via Google Fonts |

## Repo Structure

```
wwm-lab/
├── src/
│   ├── App.tsx             # Root layout: Hero → ProjectGrid → Footer
│   ├── App.css             # Footer styles
│   ├── index.css           # Global CSS variables, reset, typography
│   ├── main.tsx            # Vite entry point
│   └── components/
│       ├── Hero.tsx / .css         # Full-viewport hero, avatar, name animation
│       ├── ProjectGrid.tsx / .css  # Responsive 3-col project cards
│       ├── VisitorCount.tsx / .css # Fetches /api/visits, shows live count
│       └── SocialLinks.tsx / .css  # GitHub + X icon links
├── functions/
│   └── api/
│       └── visits.ts       # Cloudflare Pages Function: GET /api/visits (KV counter)
├── worker/
│   └── index.ts            # Legacy Worker entry (kept for reference, not active)
├── public/
│   ├── avatar.jpg          # Eddy's avatar (black & white illustration)
│   └── favicon.svg         # "ew" monogram favicon
├── wrangler.toml           # Cloudflare Pages config + KV binding
├── index.html              # HTML shell (Google Fonts loaded here)
├── package.json
└── vite.config.ts
```

## Design System

- **Theme:** White / ink-on-paper. Warm white bg (`#fafaf8`), ink-black text (`#0a0a0a`), amber accent (`#e8960a`) for interactive elements only.
- **CSS variables** are defined in `src/index.css` — always use them (`--bg`, `--text-1`, `--amber`, etc.), never hardcode colors.
- **No UI libraries** — all components are hand-written CSS.
- **Animations** are CSS-only (no animation libraries).

## Key Conventions

- **Ship fast** — prefer simple, working solutions over engineering elegance.
- **No new dependencies** unless genuinely necessary — keep the bundle small.
- **Components stay co-located** — each `.tsx` has a matching `.css` in the same folder.
- **No comments** in code unless the why is non-obvious.
- New projects go in `ProjectGrid.tsx` — add to the `PROJECTS` array.

## Local Dev

```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # Production build → dist/
```

## Deployment

Push to `main` → Cloudflare Pages auto-deploys.

- Build command: `npm run build`
- Output directory: `dist`
- Functions in `functions/api/` are deployed automatically as Pages Functions
- KV namespace `VISITS` must be bound in Cloudflare Pages dashboard → Settings → Functions → KV bindings

## Environment

- No `.env` file needed locally — the KV binding is only available in Cloudflare's runtime.
- The visitor counter shows `—` gracefully when `/api/visits` is unreachable (local dev).
