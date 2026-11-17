import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Canonical site URL. Prefer VITE_SITE_URL; on Vercel fall back to the production domain
// (Vercel sets VERCEL_PROJECT_PRODUCTION_URL during builds). Vite exposes VITE_* from process.env.
if (!process.env.VITE_SITE_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  process.env.VITE_SITE_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
