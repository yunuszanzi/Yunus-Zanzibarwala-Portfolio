// Settings and helpers for components/layout/ConstellationBackground.jsx.

export const LINK_DISTANCE = 140 // px between particles before a line is drawn
export const CURSOR_RADIUS = 190 // px around the cursor that particles link to and avoid
export const PUSH = 0.9 // how strongly particles drift away from the cursor
export const PARALLAX = 26 // max px the field shifts with the mouse (scaled by depth)
export const SCROLL_PARALLAX = 0.06 // fraction of scroll the field moves (scaled by depth)
export const BUCKETS = 6 // opacity levels used to batch drawing

/**
 * Read a hex colour CSS variable from <html> as "r, g, b" so we can vary alpha. Reading a
 * custom property doesn't force a layout (a probe element would). Nested var() references
 * are already resolved in the computed value.
 */
export function rgbOf(varName, fallback = '#e9b44c') {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  const hex = /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

/** Particle count scales with screen area: fewer on phones. */
export function makeParticles(w, h) {
  const mobile = w < 768
  const count = Math.min(mobile ? 48 : 130, Math.round((w * h) / (mobile ? 9000 : 12000)))
  return Array.from({ length: count }, () => {
    const depth = 0.35 + Math.random() * 0.65 // 1 = near: moves more, looks bigger
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25 * depth,
      vy: (Math.random() - 0.5) * 0.25 * depth,
      ox: 0, // offset from the cursor push, eases back to 0
      oy: 0,
      depth,
      r: 0.8 + depth * 1.6,
    }
  })
}
