import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',       // ✅ must be "/" for Vercel SPA routing
  build: {
    outDir: 'dist',  // ✅ ensures correct output
  },
})
