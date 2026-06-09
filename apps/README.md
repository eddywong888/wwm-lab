# apps/

Mini apps, games, and experiments live here. Each subfolder is a self-contained project.

## Structure

```
apps/
├── game-1/       ← first browser game
├── experiment-1/ ← first SEO/web experiment
└── ...
```

## Conventions

- Each app has its own `package.json`, `README.md`, and build setup
- Apps deploy independently to Cloudflare Pages (or as a sub-path)
- Name folders with kebab-case: `word-game`, `seo-tool`, `click-battle`
