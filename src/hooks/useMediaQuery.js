import { useCallback, useSyncExternalStore } from 'react'

/**
 * True while the CSS media query matches. Returns false during server rendering and
 * hydration, then updates, so pre-rendered HTML always matches the first client render.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
