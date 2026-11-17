// Build-time renderer for the public home page (see scripts/prerender.mjs).
// Fetches the same data the page uses, renders it to HTML, and returns the query cache so
// the browser can hydrate without a loading flash. Content is a snapshot from build time;
// the browser refetches live data straight after loading.
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider, dehydrate } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import ThemeProvider from './components/layout/ThemeProvider'
import Home from './pages/Home'
import { PUBLIC_QUERIES } from './hooks/queries'

export async function render() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: Infinity } },
  })
  await Promise.all(PUBLIC_QUERIES.map((q) => queryClient.fetchQuery(q)))

  const helmetContext = {}
  // Same provider order as App.jsx (RouterProvider adds no DOM), so hydration matches.
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Home />
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  )

  const settings = queryClient.getQueryData(['site_settings'])
  const projects = queryClient.getQueryData(['projects']) ?? []
  const lastmod = [settings, ...projects]
    .map((r) => r?.updated_at)
    .filter(Boolean)
    .sort()
    .pop()

  return {
    html,
    head: ['title', 'meta', 'link', 'script']
      .map((k) => helmetContext.helmet?.[k]?.toString() ?? '')
      .join(''),
    state: dehydrate(queryClient),
    accent: settings?.accent_color,
    lastmod,
  }
}
