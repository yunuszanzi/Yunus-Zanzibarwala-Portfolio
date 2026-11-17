import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { hydrate } from '@tanstack/react-query'
import App from './App'
import { queryClient } from './lib/queryClient'
import './styles/index.css'

// Data baked in by the build-time pre-renderer (scripts/prerender.mjs). Only the home page
// uses it (the admin must load fresh data, drafts included), and it's marked stale at once so
// React Query refetches live data straight after the page loads, even right after a deploy.
if (window.__RQ_STATE__ && window.location.pathname === '/') {
  hydrate(queryClient, window.__RQ_STATE__)
  queryClient.invalidateQueries()
}
delete window.__RQ_STATE__

const container = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Only "/" is pre-rendered. Any other route served the same HTML (e.g. a dev preview
// server) starts from an empty root instead of hydrating mismatched markup.
if (container.hasChildNodes() && window.location.pathname === '/') {
  hydrateRoot(container, app)
} else {
  container.textContent = ''
  createRoot(container).render(app)
}
