import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-5xl', xl: 'max-w-7xl' }

/**
 * Accessible modal built on <dialog> (focus trap, Esc to close, inert background).
 * @param {{ open: boolean, onClose: () => void, title: string, size?: 'sm'|'md'|'lg'|'xl', children: any }} props
 */
export default function Modal({ open, onClose, title, size = 'md', children }) {
  const ref = useRef(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        'border-line bg-surface text-fg m-auto w-[calc(100%-2rem)] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        sizes[size],
      )}
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="border-line bg-surface sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-6 py-4">
            <h2 className="text-lg font-medium">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-muted hover:text-fg -mr-2 inline-flex size-10 items-center justify-center rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      )}
    </dialog>
  )
}
