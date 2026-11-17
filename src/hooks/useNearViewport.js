import { useEffect, useRef, useState } from 'react'

const INTERACTIONS = ['scroll', 'pointerdown', 'keydown', 'touchstart']

/**
 * Returns [ref, ready]. `ready` turns true (and stays true) once the element comes within
 * `margin` of the viewport, or on the visitor's first scroll/tap/key press, whichever is
 * first. Used to load below-the-fold chunks without competing with the first paint.
 */
export function useNearViewport(margin = '600px') {
  const ref = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || ready) return undefined
    const done = () => setReady(true)

    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && done(),
      { rootMargin: margin },
    )
    io.observe(el)
    // Fallback so it never depends on reaching the section by scrolling alone.
    INTERACTIONS.forEach((t) => window.addEventListener(t, done, { once: true, passive: true }))

    return () => {
      io.disconnect()
      INTERACTIONS.forEach((t) => window.removeEventListener(t, done))
    }
  }, [margin, ready])

  return [ref, ready]
}
