import { cn } from '../../lib/utils'

const variants = {
  // Small mono outline: labels and metadata.
  outline: 'border-line text-muted border px-3 py-1 font-mono text-xs',
  // Tinted pill for tech/skills: easier to read in long lists.
  soft: 'bg-surface-2 text-fg/90 border border-transparent px-3 py-1.5 text-[13px] leading-none transition-colors hover:border-accent/40 hover:text-fg',
}

/** @param {{ variant?: 'outline'|'soft', className?: string, children: any }} props */
export default function Chip({ variant = 'outline', className, children }) {
  return (
    <span className={cn('inline-flex items-center rounded-full', variants[variant], className)}>
      {children}
    </span>
  )
}
