import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/apps/thane-war-2/',
  build: {
    outDir: '../../dist/apps/thane-war-2',
    emptyOutDir: true,
  },
})
