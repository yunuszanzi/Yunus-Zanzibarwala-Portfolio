import { Controller } from 'react-hook-form'
import { Field, Input, Textarea } from '../ui/Field'
import { cn, getError } from '../../lib/utils'

/**
 * Text input or textarea wired to react-hook-form.
 * @param {{ form: any, name: string, label: string, hint?: string, textarea?: boolean, rows?: number, className?: string }} props
 */
export function TextField({ form, name, label, hint, textarea, rows = 4, className, ...rest }) {
  const error = getError(form.formState.errors, name)
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(p) =>
        textarea ? (
          <Textarea {...p} rows={rows} {...form.register(name)} {...rest} />
        ) : (
          <Input {...p} {...form.register(name)} {...rest} />
        )
      }
    </Field>
  )
}

/** On/off switch. */
export function Switch({ checked, onChange, label, description, id }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="text-muted block text-xs">{description}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-line',
        )}
      >
        <span
          className={cn(
            'bg-fg inline-block size-5 rounded-full shadow transition-transform',
            checked ? 'bg-accent-fg translate-x-5.5' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  )
}

/** Switch bound to a boolean form field. */
export function SwitchField({ form, name, ...rest }) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Switch
          id={`switch-${name}`}
          checked={Boolean(field.value)}
          onChange={field.onChange}
          {...rest}
        />
      )}
    />
  )
}

/** Card grouping related fields in a form. */
export function FormSection({ title, description, children, className }) {
  return (
    <section className={cn('border-line bg-surface rounded-xl border p-5 md:p-6', className)}>
      <h2 className="font-medium">{title}</h2>
      {description && <p className="text-muted mt-1 text-sm">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}
