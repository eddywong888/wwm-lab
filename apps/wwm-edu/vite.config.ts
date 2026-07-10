import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/apps/wwm-edu/',
  build: {
    outDir: '../../dist/apps/wwm-edu',
    emptyOutDir: true,
  },
})
