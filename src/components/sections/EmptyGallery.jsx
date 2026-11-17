import { ImageOff } from 'lucide-react'

/** Placeholder shown when a project has no screenshots yet. */
export default function EmptyGallery({ title }) {
  return (
    <div className="border-line bg-surface text-muted flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border">
      <ImageOff size={28} aria-hidden="true" />
      <p className="font-mono text-xs tracking-widest uppercase">Screenshots coming soon</p>
      <span className="sr-only">No screenshots for {title} yet</span>
    </div>
  )
}
