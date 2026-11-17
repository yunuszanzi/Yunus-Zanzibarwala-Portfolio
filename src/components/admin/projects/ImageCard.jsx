import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { inputClass } from '../../ui/Field'
import { cn } from '../../../lib/utils'

/**
 * One screenshot: thumbnail, step label and caption (saved when the field loses focus).
 * @param {{ image: any, index: number, total: number, handle: any, onSave: (patch: object) => void, onDelete: () => void }} props
 */
export default function ImageCard({ image, index, total, handle, onSave, onDelete }) {
  const [step, setStep] = useState(image.step_label)
  const [caption, setCaption] = useState(image.caption)
  const n = (v) => String(v).padStart(2, '0')

  const saveIfChanged = (field, value) => {
    if (value.trim() !== (image[field] ?? '')) onSave({ [field]: value.trim() })
  }

  return (
    <div className="border-line bg-bg flex h-full flex-col overflow-hidden rounded-xl border">
      <div className="bg-surface-2 relative aspect-video">
        <img
          src={image.image_url}
          alt={caption || `Screenshot ${index + 1}`}
          className="size-full object-contain"
          loading="lazy"
        />
        <span className="bg-bg/80 absolute top-2 left-2 rounded-full px-2 py-0.5 font-mono text-[11px] backdrop-blur">
          {n(index + 1)}/{n(total)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <label className="sr-only" htmlFor={`step-${image.id}`}>
          Step label for screenshot {index + 1}
        </label>
        <input
          id={`step-${image.id}`}
          value={step}
          maxLength={80}
          onChange={(e) => setStep(e.target.value)}
          onBlur={() => saveIfChanged('step_label', step)}
          placeholder="Step label, e.g. Sign in"
          className={cn(inputClass, 'py-2')}
        />
        <label className="sr-only" htmlFor={`cap-${image.id}`}>
          Caption and alt text for screenshot {index + 1}
        </label>
        <input
          id={`cap-${image.id}`}
          value={caption}
          maxLength={200}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => saveIfChanged('caption', caption)}
          placeholder="Caption (also used as alt text)"
          className={cn(inputClass, 'py-2')}
        />
        <div className="mt-auto flex items-center justify-between pt-1">
          {handle}
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete screenshot ${index + 1}`}
            className="text-muted hover:bg-danger/10 hover:text-danger inline-flex size-10 items-center justify-center rounded-lg"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
