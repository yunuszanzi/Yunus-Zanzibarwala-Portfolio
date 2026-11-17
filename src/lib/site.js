/**
 * Public site address, used for canonical URLs, Open Graph and the sitemap.
 * Set VITE_SITE_URL in .env / Vercel. On Vercel it falls back to the production domain
 * automatically (see vite.config.js).
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'http://localhost:5173').replace(
  /\/$/,
  '',
)
