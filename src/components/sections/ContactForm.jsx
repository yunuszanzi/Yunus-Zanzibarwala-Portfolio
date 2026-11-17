import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import Button from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Field'
import { contactSchema } from '../../lib/schemas'
import { useSendMessage } from '../../hooks/queries'

// Real people take a few seconds to fill the form; instant submits are almost always bots.
const MIN_FILL_MS = 2500

/** Public contact form. Messages land in the admin inbox. */
export default function ContactForm() {
  const send = useSendMessage()
  const startedAt = useRef(Date.now())
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', message: '', website: '' },
  })

  const onSubmit = async (values) => {
    setError('')
    try {
      // Too fast: treat like the honeypot (fake success, nothing stored).
      const tooFast = Date.now() - startedAt.current < MIN_FILL_MS
      await send.mutateAsync(tooFast ? { ...values, website: 'too-fast' } : values)
      reset()
      setSent(true)
    } catch {
      setError('Your message didn’t go through. Try again, or email me directly.')
    }
  }

  if (sent) {
    return (
      <div role="status" className="border-line bg-surface mt-10 rounded-2xl border p-6">
        <CheckCircle2 size={22} className="text-accent" aria-hidden="true" />
        <p className="mt-3 font-medium">Thanks, your message is on its way.</p>
        <p className="text-muted mt-1 text-sm">I usually reply within a day or two.</p>
        <Button
          variant="ghost"
          className="mt-5"
          onClick={() => {
            startedAt.current = Date.now()
            setSent(false)
          }}
        >
          Send another
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-labelledby="contact-form-title"
      className="border-line mt-10 space-y-5 border-t pt-10"
    >
      <h3 id="contact-form-title" className="font-display text-2xl">
        Or send a message
      </h3>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          {(p) => <Input {...p} autoComplete="name" {...register('name')} />}
        </Field>
        <Field label="Email" error={errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...register('email')} />}
        </Field>
      </div>
      <Field label="Message" error={errors.message?.message}>
        {(p) => <Textarea {...p} rows={5} {...register('message')} />}
      </Field>

      {/* Honeypot: hidden from people and screen readers, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>

      {error && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2.5 text-sm">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Send size={16} aria-hidden="true" />
        )}
        {isSubmitting ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  )
}
