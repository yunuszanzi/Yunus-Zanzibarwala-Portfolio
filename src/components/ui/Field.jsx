import { forwardRef, useId } from 'react'
import { cn } from '../../lib/utils'

export const inputClass =
  'w-full rounded-lg border border-line bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-muted/70 transition-colors hover:border-muted focus:border-accent focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-danger'

/**
 * Label + control + hint/error. Pass the control as a render function so it gets the ids.
 * @param {{ label: string, error?: string, hint?: string, children: (ids: {id:string, describedBy?:string, invalid:boolean}) => any, className?: string }} props
 */
export function Field({ label, error, hint, className, children }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-muted text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  )
}

export const Input = forwardRef(function Input({ className, invalid, describedBy, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(inputClass, className)}
      {...rest}
    />
  )
})

export const Textarea = forwardRef(function Textarea(
  { className, invalid, describedBy, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(inputClass, 'resize-y leading-relaxed', className)}
      {...rest}
    />
  )
})
