import { useRouteError } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

/**
 * Shown when a page crashes or a code chunk fails to load (usually right after a new
 * deploy, when the browser still has the old page). Reloading fixes the chunk case.
 */
export default function RouteError() {
  const error = useRouteError()
  const chunkFailed = /dynamically imported module|Loading chunk|Failed to fetch/i.test(
    String(error?.message ?? error),
  )
  if (import.meta.env.DEV) console.error(error)

  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-3xl items-center px-5">
      <Helmet>
        <title>Something went wrong</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="flex flex-col items-start gap-4">
        <p className="text-accent font-mono text-sm">Error</p>
        <h1 className="font-display text-4xl md:text-5xl">
          {chunkFailed ? 'The site was just updated.' : 'Something broke on this page.'}
        </h1>
        <p className="text-muted">
          {chunkFailed
            ? 'Reload to get the latest version.'
            : 'Try reloading. If it keeps happening, go back to the homepage.'}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-accent text-accent-fg inline-flex min-h-11 items-center rounded-full px-5 text-sm font-medium hover:brightness-110"
          >
            Reload
          </button>
          <a
            href="/"
            className="border-line hover:border-muted inline-flex min-h-11 items-center rounded-full border px-5 text-sm"
          >
            Homepage
          </a>
        </div>
      </div>
    </main>
  )
}
