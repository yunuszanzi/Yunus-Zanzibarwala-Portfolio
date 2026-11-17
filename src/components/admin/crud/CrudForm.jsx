import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { SwitchField, TextField } from '../FormFields'
import ChipInput from '../ChipInput'
import Button from '../../ui/Button'
import { Field } from '../../ui/Field'
import { cn } from '../../../lib/utils'

function FieldControl({ form, field }) {
  const { name, label, type, hint, rows, placeholder } = field
  if (type === 'switch') return <SwitchField form={form} name={name} label={label} />
  if (type === 'chips') {
    return (
      <Field label={label} hint={hint}>
        {(p) => (
          <Controller
            control={form.control}
            name={name}
            render={({ field: f }) => <ChipInput {...p} value={f.value} onChange={f.onChange} />}
          />
        )}
      </Field>
    )
  }
  return (
    <TextField
      form={form}
      name={name}
      label={label}
      hint={hint}
      placeholder={placeholder}
      textarea={type === 'textarea'}
      rows={rows}
      type={type === 'url' ? 'url' : type === 'date' ? 'date' : 'text'}
    />
  )
}

/**
 * Generic form for a module item, driven by `fields` config.
 * @param {{ schema: any, fields: any[], defaultValues: object, onSubmit: (values: object) => Promise<void>, onCancel: () => void, submitLabel: string }} props
 */
export default function CrudForm({
  schema,
  fields,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
}) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues })
  const isCurrent = form.watch('is_current')
  const { isSubmitting } = form.formState

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
      {fields.map((f) =>
        // "End date" is irrelevant while "I work here now" is on.
        f.name === 'end_date' && isCurrent ? null : (
          <div key={f.name} className={cn(f.half ? 'sm:col-span-1' : 'sm:col-span-2')}>
            <FieldControl form={form} field={f} />
          </div>
        ),
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
