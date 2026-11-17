import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import FullPageSpinner from '../ui/FullPageSpinner'

/** Redirects to /admin/login when logged out; blocks signed-in users who aren't the owner. */
export default function RequireAuth({ children }) {
  const { session, isOwner, loading, signOut, user } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner label="Checking your session" />
  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }
  if (!isOwner) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <ShieldAlert size={32} className="text-accent" aria-hidden="true" />
        <h1 className="font-display text-3xl">No access</h1>
        <p className="text-muted max-w-sm text-sm">
          You’re signed in as {user?.email}, which isn’t the owner account.
        </p>
        <Button variant="ghost" onClick={signOut}>
          Sign out
        </Button>
      </main>
    )
  }
  return children
}
