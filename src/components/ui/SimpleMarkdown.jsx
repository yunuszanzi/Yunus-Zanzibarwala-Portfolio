import { Fragment } from 'react'

// Tiny Markdown renderer for the bio: paragraphs (blank line), **bold**, *italic* / _italic_,
// `code` and [links](https://…). Builds React elements, never raw HTML, so it's XSS-safe.
// Replaces react-markdown (~125 KB) since the bio needs nothing more.

const INLINE = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g
const SAFE_URL = /^(https?:\/\/|mailto:|tel:|\/|#)/i

function renderInline(text, keyPrefix) {
  const out = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = `${keyPrefix}-${i++}`
    if (m[2]) out.push(<strong key={key}>{renderInline(m[2], key)}</strong>)
    else if (m[3] || m[4]) out.push(<em key={key}>{renderInline(m[3] || m[4], key)}</em>)
    else if (m[5]) out.push(<code key={key}>{m[5]}</code>)
    else if (m[6]) {
      const href = m[7]
      const external = /^https?:/i.test(href)
      out.push(
        SAFE_URL.test(href) ? (
          <a
            key={key}
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {m[6]}
          </a>
        ) : (
          m[6]
        ),
      )
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** @param {{ children: string }} props */
export default function SimpleMarkdown({ children = '' }) {
  const paragraphs = String(children)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  return paragraphs.map((p, i) => (
    <p key={i}>
      {p.split('\n').map((line, j, lines) => (
        <Fragment key={j}>
          {renderInline(line, `${i}-${j}`)}
          {j < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </p>
  ))
}
