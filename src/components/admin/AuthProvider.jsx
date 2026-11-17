import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { AuthContext } from '../../lib/authContext'
import { OWNER_EMAIL } from '../../lib/constants'
import { queryClient } from '../../lib/queryClient'

/** Tracks the Supabase session. Supabase persists it in localStorage, so reloads stay logged in. */
export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Drafts and messages are only visible once logged in, so refetch everything.
    queryClient.invalidateQueries()
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    queryClient.clear()
  }, [])

  const value = useMemo(() => {
    const user = session?.user ?? null
    return {
      session,
      user,
      isOwner: user?.email?.toLowerCase() === OWNER_EMAIL,
      loading,
      signIn,
      signOut,
    }
  }, [session, loading, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
