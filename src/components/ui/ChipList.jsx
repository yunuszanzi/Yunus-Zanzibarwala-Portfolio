import { useId, useState } from 'react'
import Chip from './Chip'

/**
 * Wrapping list of soft chips. Long lists show the first `limit` items with a "+N more"
 * toggle so a big stack doesn't turn into a wall of pills.
 * @param {{ items: string[], limit?: number, label: string }} props
 */
export default function ChipList({ items, limit = 12, label }) {
  const [all, setAll] = useState(false)
  const id = useId()
  const hidden = items.length - limit
  const shown = all || hidden <= 0 ? items : items.slice(0, limit)

  return (
    <div>
      <ul id={id} aria-label={label} className="flex flex-wrap gap-2">
        {shown.map((t) => (
          <li key={t}>
            <Chip variant="soft">{t}</Chip>
          </li>
        ))}
        {hidden > 0 && (
          <li>
            <button
              type="button"
              onClick={() => setAll((v) => !v)}
              aria-expanded={all}
              aria-controls={id}
              className="text-accent hover:bg-accent/10 inline-flex items-center rounded-full border border-dashed border-current px-3 py-1.5 text-[13px] leading-none transition-colors"
            >
              {all ? 'Show less' : `+${hidden} more`}
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}
