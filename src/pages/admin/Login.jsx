import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Helmet } from 'react-helmet-async'
import { Loader2, LockKeyhole } from 'lucide-react'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

function friendlyError(err) {
  const msg = err?.message ?? ''
  if (/invalid login credentials/i.test(msg)) return 'That email and password don’t match.'
  if (/email not confirmed/i.test(msg)) return 'This account’s email isn’t confirmed yet.'
  if (/rate|too many/i.test(msg)) return 'Too many attempts. Wait a minute and try again.'
  return 'Couldn’t sign in. Check your connection and try again.'
}

export default function Login() {
  const { session, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const from = location.state?.from || '/admin'
  if (!loading && session) return <Navigate to={from} replace />

  const onSubmit = async ({ email, password }) => {
    setError('')
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  return (
    <main id="main" className="flex min-h-screen items-center justify-center px-5 py-16">
      <Helmet>
        <title>Sign in | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="border-line bg-surface w-full max-w-sm rounded-2xl border p-8 shadow-xl">
        <div className="bg-surface-2 text-accent mb-6 inline-flex size-11 items-center justify-center rounded-full">
          <LockKeyhole size={20} aria-hidden="true" />
        </div>
        <h1 className="font-display text-3xl">Sign in</h1>
        <p className="text-muted mt-2 text-sm">Admin area for editing the portfolio.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
          <Field label="Email" error={errors.email?.message}>
            {(p) => (
              <Input {...p} type="email" autoComplete="username" autoFocus {...register('email')} />
            )}
          </Field>
          <Field label="Password" error={errors.password?.message}>
            {(p) => (
              <Input
                {...p}
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
            )}
          </Field>
          {error && (
            <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2.5 text-sm">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  )
}
