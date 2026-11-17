import { cn } from '../../lib/utils'

/** Grey pulsing block used while content loads. */
export default function Skeleton({ className }) {
  return (
    <div aria-hidden="true" className={cn('bg-surface-2 animate-pulse rounded-lg', className)} />
  )
}

/** A few lines of skeleton text. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}
