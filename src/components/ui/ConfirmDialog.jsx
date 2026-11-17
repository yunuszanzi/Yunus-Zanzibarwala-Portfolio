import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

/**
 * "Are you sure?" dialog. `onConfirm` may be async; the dialog stays open while it runs.
 * @param {{ open: boolean, onClose: () => void, onConfirm: () => any, title?: string, message: any, confirmLabel?: string }} props
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Delete this?',
  message,
  confirmLabel = 'Delete',
}) {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title} size="sm">
      <div className="text-muted text-sm leading-relaxed">{message}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={confirm} disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
