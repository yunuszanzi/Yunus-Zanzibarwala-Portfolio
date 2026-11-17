const EVENTS = ['pointermove', 'pointerdown', 'scroll', 'keydown', 'touchstart']
const IDLE_FALLBACK_MS = 6000

/**
 * Refetch every query once, on the visitor's first interaction or after a few idle
 * seconds, whichever comes first. The pre-rendered page is already complete, so this keeps
 * the (large) Supabase client and the refetch out of the critical first seconds while
 * still showing the latest admin edits almost immediately.
 */
export function refreshAfterEngagement(queryClient) {
  let done = false
  let timer
  const refresh = () => {
    if (done) return
    done = true
    clearTimeout(timer)
    EVENTS.forEach((t) => window.removeEventListener(t, refresh))
    queryClient.invalidateQueries()
  }
  EVENTS.forEach((t) => window.addEventListener(t, refresh, { passive: true }))
  const arm = () => {
    timer = setTimeout(refresh, IDLE_FALLBACK_MS)
  }
  if (document.readyState === 'complete') arm()
  else window.addEventListener('load', arm, { once: true })
}
