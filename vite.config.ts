import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-routing',
      configureServer(server) {
        const apps = ['memory-card', 'thane-war'];
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            const url = req.url.split('?')[0];
            for (const app of apps) {
              if (url === `/apps/${app}` || url === `/apps/${app}/`) {
                req.url = `/apps/${app}/index.html` + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
              }
            }
            // Committed prebuilt downloads: serve raw, bypassing Vite's HTML
            // transform so the file stays self-contained in dev too.
            if (url.startsWith('/downloads/') && !url.includes('..')) {
              const base = join(server.config.root, 'prebuilt', url);
              const file = existsSync(base) ? base : existsSync(base + '.html') ? base + '.html' : null;
              if (file) {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Content-Disposition', 'attachment; filename="thane-war.html"');
                res.end(readFileSync(file));
                return;
              }
            }
          }
          next();
        });
      }
    }
  ],
})
