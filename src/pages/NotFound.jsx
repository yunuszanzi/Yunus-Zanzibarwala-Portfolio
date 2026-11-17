import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

/** 404 page. With `admin`, renders inside the admin shell and links back to the dashboard. */
export default function NotFound({ admin = false }) {
  const content = (
    <div className="flex flex-col items-start gap-4">
      <p className="text-accent font-mono text-sm">404</p>
      <h1 className="font-display text-4xl md:text-5xl">This page doesn’t exist.</h1>
      <p className="text-muted">The link might be old, or there’s a typo in the address.</p>
      <Link
        to={admin ? '/admin' : '/'}
        className="bg-accent text-accent-fg mt-2 inline-flex min-h-11 items-center rounded-full px-5 text-sm font-medium hover:brightness-110"
      >
        {admin ? 'Back to dashboard' : 'Back to the homepage'}
      </Link>
    </div>
  )
  if (admin) return content
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-3xl items-center px-5">
      <Helmet>
        <title>Page not found</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      {content}
    </main>
  )
}
