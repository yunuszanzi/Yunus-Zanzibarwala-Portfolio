import { useEffect, useState } from 'react'

/**
 * Returns [ref, seen]. `seen` turns true (and stays true) once the element comes within
 * `margin` of the viewport. False during server rendering, so pre-rendered HTML leaves out
 * whatever is gated on it.
 *
 * `ref` is a callback ref, so observation starts whenever the element mounts, including
 * when it appears later (e.g. a gallery that shows up after live data adds screenshots).
 */
export function useInView(margin = '400px') {
  const [el, setEl] = useState(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (!el || seen) return undefined
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && setSeen(true),
      { rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [el, margin, seen])

  return [setEl, seen]
}
