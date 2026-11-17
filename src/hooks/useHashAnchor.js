import { useEffect } from 'react'

/**
 * When the page opens on a link like /#contact, the browser scrolls to the section's spot in
 * the pre-rendered HTML. After load, desktop galleries grow and push sections down, so this
 * keeps the target section in place while the layout settles. It stops as soon as the
 * visitor scrolls themselves, or after a few seconds.
 */
export function useHashAnchor() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    const target = id && document.getElementById(id)
    if (!target) return undefined

    let done = false
    const stop = () => {
      done = true
      ro.disconnect()
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchmove', stop)
      window.removeEventListener('keydown', stop)
    }
    // 'instant': the page has smooth scrolling on, which would leave it mid-animation.
    const align = () => !done && target.scrollIntoView({ block: 'start', behavior: 'instant' })
    const ro = new ResizeObserver(align)
    ro.observe(document.body)
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchmove', stop, { passive: true })
    window.addEventListener('keydown', stop)
    const timer = setTimeout(stop, 4000)
    align()
    return () => {
      clearTimeout(timer)
      stop()
    }
  }, [])
}
