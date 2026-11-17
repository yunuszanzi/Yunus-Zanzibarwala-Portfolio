import { cn } from '../../lib/utils'

export default function Chip({ className, children }) {
  return (
    <span
      className={cn(
        'border-line text-muted inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs',
        className,
      )}
    >
      {children}
    </span>
  )
}
