import { Loader2 } from 'lucide-react'

export default function FullPageSpinner({ label = 'Loading' }) {
  return (
    <div className="text-muted flex min-h-screen items-center justify-center gap-3" role="status">
      <Loader2 size={20} className="animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}…</span>
    </div>
  )
}
