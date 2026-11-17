import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { hydrate } from '@tanstack/react-query'
import App from './App'
import { queryClient } from './lib/queryClient'
import { refreshAfterEngagement } from './lib/freshData'
import './styles/index.css'

// Data baked in by the build-time pre-renderer (scripts/prerender.mjs). Only the home page
// uses it (the admin must load fresh data, drafts included). It's treated as fresh at load,
// so the page renders instantly without loading the Supabase client, then it's refreshed
// with live data on the visitor's first interaction (or after a few idle seconds).
if (window.__RQ_STATE__ && window.location.pathname === '/') {
  const state = window.__RQ_STATE__
  const now = Date.now()
  for (const q of state.queries ?? []) q.state.dataUpdatedAt = now
  hydrate(queryClient, state)
  refreshAfterEngagement(queryClient)
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
