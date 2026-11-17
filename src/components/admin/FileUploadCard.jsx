import { useId, useRef, useState } from 'react'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'

/** Thin progress bar. `value` is 0..1. */
export function ProgressBar({ value, label = 'Upload progress' }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="bg-line h-1.5 w-full overflow-hidden rounded-full"
    >
      <div className="bg-accent h-full transition-[width]" style={{ width: `${value * 100}%` }} />
    </div>
  )
}

/**
 * One uploadable file (image or PDF) with preview, replace and remove.
 * @param {{ label: string, hint?: string, accept: string, kind?: 'image'|'pdf', url?: string|null, onUpload: (file: File, onProgress: (p:number)=>void) => Promise<void>, onRemove: () => Promise<void> }} props
 */
export default function FileUploadCard({
  label,
  hint,
  accept,
  kind = 'image',
  url,
  onUpload,
  onRemove,
}) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [progress, setProgress] = useState(null)
  const [confirm, setConfirm] = useState(false)

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setProgress(0)
    try {
      await onUpload(file, setProgress)
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={inputId} className="block text-sm font-medium">
          {label}
        </label>
        {hint && <p className="text-muted text-xs">{hint}</p>}
      </div>
      {url ? (
        kind === 'image' ? (
          <img
            src={url}
            alt={`Current ${label.toLowerCase()}`}
            className="border-line bg-surface-2 aspect-[1200/630] w-full max-w-sm rounded-lg border object-contain"
          />
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="border-line hover:border-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <FileText size={16} aria-hidden="true" /> View current file
          </a>
        )
      ) : (
        <p className="text-muted text-sm">Nothing uploaded yet.</p>
      )}
      {progress !== null && <ProgressBar value={progress} />}
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          onChange={pick}
          className="sr-only"
          disabled={progress !== null}
        />
        <Button
          variant="ghost"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
        >
          {progress !== null ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Upload size={15} aria-hidden="true" />
          )}
          {url ? 'Replace' : 'Upload'}
        </Button>
        {url && (
          <Button variant="subtle" onClick={() => setConfirm(true)} disabled={progress !== null}>
            <Trash2 size={15} aria-hidden="true" /> Remove
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={onRemove}
        title={`Remove ${label.toLowerCase()}?`}
        message="The file is deleted from storage. You can upload a new one any time."
        confirmLabel="Remove"
      />
    </div>
  )
}
