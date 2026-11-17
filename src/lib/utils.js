/** Join class names, skipping falsy values. */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

/** Read a nested react-hook-form error like "social_links.0.url". */
export function getError(errors, name) {
  return name.split('.').reduce((acc, key) => acc?.[key], errors)?.message
}

/** Turn a Supabase/JS error into a short message for a toast. */
export function errorMessage(err, fallback = 'Something went wrong. Try again.') {
  const msg = err?.message || ''
  if (/duplicate key.*slug/i.test(msg)) return 'Another project already uses that slug.'
  if (/row-level security|permission denied|JWT/i.test(msg))
    return 'You don’t have permission. Sign in again.'
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Network error. Check your connection.'
  return msg || fallback
}

/** "My Project!" -> "my-project" */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Step caption like "01/07 — Sign in". */
export function stepCaption(index, total, image) {
  const n = (v) => String(v).padStart(2, '0')
  const label = image.step_label || image.caption
  return `${n(index + 1)}/${n(total)}${label ? ` — ${label}` : ''}`
}

/** Format a date string like "2024-01-01" as "Jan 2024". */
export function formatMonthYear(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
