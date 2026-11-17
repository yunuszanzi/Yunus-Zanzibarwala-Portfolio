import { useEffect, useRef } from 'react'
import {
  BUCKETS,
  CURSOR_RADIUS,
  LINK_DISTANCE,
  PARALLAX,
  PUSH,
  SCROLL_PARALLAX,
  makeParticles,
  rgbOf,
} from '../../lib/constellation'

/**
 * Full-page animated "constellation" behind the content. Particles drift and link up; near
 * the cursor they connect to it and ease away, and the whole field shifts with the mouse
 * and scroll for depth. Also sets --mx/--my on <html> (-1..1) so other elements (the hero
 * glow) can follow the cursor with pure CSS.
 *
 * Starts after the page has loaded (so it never delays the first paint), pauses when the
 * tab is hidden, and draws a single still frame for prefers-reduced-motion.
 */
export default function ConstellationBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const root = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let particles = []
    let colors = {}
    let raf = 0
    let running = false
    const mouse = { x: -9999, y: -9999, tx: 0, ty: 0, px: 0, py: 0, active: false }

    const readColors = () => {
      const light = root.dataset.theme === 'light'
      colors = {
        accent: rgbOf('--accent', '#e9b44c'),
        dot: light ? 0.6 : 0.8,
        line: light ? 0.3 : 0.32,
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = makeParticles(w, h)
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      // Ease the parallax target so the field glides rather than snaps.
      mouse.px += (mouse.tx - mouse.px) * 0.06
      mouse.py += (mouse.ty - mouse.py) * 0.06
      const scroll = window.scrollY * SCROLL_PARALLAX

      const pts = particles.map((p) => {
        if (!reduce) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < -20) p.x = w + 20
          else if (p.x > w + 20) p.x = -20
          if (p.y < -20) p.y = h + 20
          else if (p.y > h + 20) p.y = -20
        }
        // Screen position with parallax (near particles move more).
        let sx = p.x + mouse.px * PARALLAX * p.depth
        let sy =
          ((((p.y - scroll * p.depth) % (h + 40)) + h + 40) % (h + 40)) -
          20 +
          mouse.py * PARALLAX * p.depth
        // Ease away from the cursor.
        if (mouse.active) {
          const dx = sx - mouse.x
          const dy = sy - mouse.y
          const d = Math.hypot(dx, dy)
          if (d < CURSOR_RADIUS && d > 0.1) {
            const f = ((CURSOR_RADIUS - d) / CURSOR_RADIUS) * PUSH * 6
            p.ox += ((dx / d) * f - p.ox) * 0.08
            p.oy += ((dy / d) * f - p.oy) * 0.08
          }
        }
        p.ox *= 0.94
        p.oy *= 0.94
        sx += p.ox * 4
        sy += p.oy * 4
        return { sx, sy, p }
      })

      // Collect line segments into a few opacity buckets, then draw each bucket as ONE path.
      // Far cheaper than a stroke() per line, which matters on slower phones.
      const lines = Array.from({ length: BUCKETS }, () => [])
      const cursorLines = Array.from({ length: BUCKETS }, () => [])
      const bucket = (s) => Math.min(BUCKETS - 1, (s * BUCKETS) | 0)
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j]
          const dx = a.sx - b.sx
          if (dx > LINK_DISTANCE || dx < -LINK_DISTANCE) continue
          const dy = a.sy - b.sy
          const d2 = dx * dx + dy * dy
          if (d2 < LINK_DISTANCE * LINK_DISTANCE) {
            const s = (1 - Math.sqrt(d2) / LINK_DISTANCE) * Math.min(a.p.depth, b.p.depth)
            lines[bucket(s)].push(a.sx, a.sy, b.sx, b.sy)
          }
        }
        if (mouse.active) {
          const d = Math.hypot(a.sx - mouse.x, a.sy - mouse.y)
          if (d < CURSOR_RADIUS)
            cursorLines[bucket(1 - d / CURSOR_RADIUS)].push(a.sx, a.sy, mouse.x, mouse.y)
        }
      }
      ctx.lineWidth = 1
      const strokeBuckets = (groups, strength) => {
        groups.forEach((segs, k) => {
          if (!segs.length) return
          ctx.strokeStyle = `rgba(${colors.accent}, ${((k + 0.5) / BUCKETS) * strength})`
          ctx.beginPath()
          for (let n = 0; n < segs.length; n += 4) {
            ctx.moveTo(segs[n], segs[n + 1])
            ctx.lineTo(segs[n + 2], segs[n + 3])
          }
          ctx.stroke()
        })
      }
      strokeBuckets(lines, colors.line)
      strokeBuckets(cursorLines, Math.min(1, colors.line * 2.4))

      // Dots, grouped by depth the same way.
      const dots = Array.from({ length: BUCKETS }, () => [])
      for (const pt of pts) dots[bucket(pt.p.depth)].push(pt)
      dots.forEach((group, k) => {
        if (!group.length) return
        ctx.fillStyle = `rgba(${colors.accent}, ${colors.dot * ((k + 0.5) / BUCKETS)})`
        ctx.beginPath()
        for (const { sx, sy, p } of group) {
          ctx.moveTo(sx + p.r, sy)
          ctx.arc(sx, sy, p.r, 0, Math.PI * 2)
        }
        ctx.fill()
      })

      if (running) raf = requestAnimationFrame(draw)
    }

    // Nothing is set up until the visitor engages (moves, scrolls, touches or types), so
    // loading the page costs nothing. Then the field fades in and starts moving.
    let initialized = false
    const start = () => {
      if (running || reduce || document.hidden || !initialized) return
      running = true
      raf = requestAnimationFrame(draw)
    }
    // Redraw a still frame (after resize/theme change) when the loop isn't running.
    const redraw = () => initialized && !running && draw()
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const onPointer = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
      mouse.tx = (e.clientX / w) * 2 - 1
      mouse.ty = (e.clientY / h) * 2 - 1
      root.style.setProperty('--mx', mouse.tx.toFixed(3))
      root.style.setProperty('--my', mouse.ty.toFixed(3))
    }
    const onLeave = () => {
      mouse.active = false
      mouse.tx = 0
      mouse.ty = 0
      root.style.setProperty('--mx', '0')
      root.style.setProperty('--my', '0')
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    let resizeTimer
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        resize()
        redraw()
      }, 150)
    }
    // Theme toggles change data-theme on <html>: pick up the new colours.
    const themeObserver = new MutationObserver(() => {
      readColors()
      redraw()
    })

    const ENGAGE_EVENTS = ['pointermove', 'pointerdown', 'scroll', 'keydown', 'touchstart']
    const engage = (e) => {
      ENGAGE_EVENTS.forEach((t) => window.removeEventListener(t, engage))
      readColors()
      resize()
      if (e?.type === 'pointermove') onPointer(e)
      draw() // first frame (the only one with reduced motion)
      initialized = true
      canvas.style.opacity = '1'
      window.addEventListener('pointermove', onPointer, { passive: true })
      document.addEventListener('pointerleave', onLeave)
      document.addEventListener('visibilitychange', onVisibility)
      window.addEventListener('resize', onResize)
      // Only data-theme: the cursor writes --mx/--my to <html style> on every move.
      themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
      start()
    }
    ENGAGE_EVENTS.forEach((t) => window.addEventListener(t, engage, { passive: true }))

    return () => {
      stop()
      clearTimeout(resizeTimer)
      ENGAGE_EVENTS.forEach((t) => window.removeEventListener(t, engage))
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      themeObserver.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-0 transition-opacity duration-1000"
    />
  )
}
