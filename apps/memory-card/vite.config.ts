import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/apps/memory-card/',
  build: {
    outDir: '../../dist/apps/memory-card',
    emptyOutDir: true,
  },
})
