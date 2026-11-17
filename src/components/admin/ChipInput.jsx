import { useState } from 'react'
import { X } from 'lucide-react'
import { inputClass } from '../ui/Field'
import { cn } from '../../lib/utils'

/**
 * Tag input: type and press Enter or comma to add; Backspace on empty input removes the last chip.
 * @param {{ value: string[], onChange: (v: string[]) => void, id?: string, describedBy?: string, placeholder?: string }} props
 */
export default function ChipInput({ value = [], onChange, id, describedBy, placeholder }) {
  const [draft, setDraft] = useState('')

  const add = (raw) => {
    const items = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const next = [...value]
    items.forEach((s) => {
      if (!next.some((v) => v.toLowerCase() === s.toLowerCase())) next.push(s)
    })
    if (next.length !== value.length) onChange(next)
    setDraft('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (draft.trim()) add(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className={cn(inputClass, 'focus-within:border-accent flex flex-wrap items-center gap-2')}>
      {value.map((chip) => (
        <span
          key={chip}
          className="bg-surface-2 inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-xs"
        >
          {chip}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== chip))}
            aria-label={`Remove ${chip}`}
            className="text-muted hover:text-fg inline-flex size-6 items-center justify-center rounded-full"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        id={id}
        aria-describedby={describedBy}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length ? '' : placeholder}
        className="min-w-[8rem] flex-1 bg-transparent py-1 outline-none focus-visible:outline-none"
      />
    </div>
  )
}
