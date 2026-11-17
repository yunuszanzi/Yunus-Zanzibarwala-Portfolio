import { useEffect, useState } from 'react'

const INTERACTIONS = ['scroll', 'pointerdown', 'keydown', 'touchstart']

/**
 * Returns [ref, ready]. `ready` turns true (and stays true) once the element comes within
 * `margin` of the viewport, or on the visitor's first scroll/tap/key press, whichever is
 * first. Used to load below-the-fold chunks without competing with the first paint.
 * `ref` is a callback ref, so it works even if the element mounts after the first render.
 */
export function useNearViewport(margin = '600px') {
  const [el, setEl] = useState(null)
  const [ready, setReady] = useState(false)

  // First-interaction fallback, independent of the element.
  useEffect(() => {
    if (ready) return undefined
    const done = () => setReady(true)
    INTERACTIONS.forEach((t) => window.addEventListener(t, done, { once: true, passive: true }))
    return () => INTERACTIONS.forEach((t) => window.removeEventListener(t, done))
  }, [ready])

  useEffect(() => {
    if (!el || ready) return undefined
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && setReady(true),
      { rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [el, margin, ready])

  return [setEl, ready]
}
