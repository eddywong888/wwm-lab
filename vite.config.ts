import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-routing',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url) {
            const url = req.url.split('?')[0];
            if (url === '/apps/memory-card' || url === '/apps/memory-card/') {
              req.url = '/apps/memory-card/index.html' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
            }
          }
          next();
        });
      }
    }
  ],
})
