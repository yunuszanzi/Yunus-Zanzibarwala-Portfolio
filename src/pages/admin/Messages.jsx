import { useState } from 'react'
import { ChevronDown, Mail, MailOpen, Reply, Trash2 } from 'lucide-react'
import PageHeader from '../../components/admin/PageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Skeleton from '../../components/ui/Skeleton'
import ErrorNote from '../../components/ui/ErrorNote'
import Button from '../../components/ui/Button'
import { messages } from '../../hooks/queries'
import { useToast } from '../../hooks/useToast'
import { cn, errorMessage } from '../../lib/utils'

const fmt = (d) =>
  new Date(d).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/** Contact-form inbox. Opening a message marks it read. */
export default function Messages() {
  const { data, isLoading, error } = messages.useList()
  const update = messages.useUpdate()
  const remove = messages.useRemove()
  const toast = useToast()
  const [open, setOpen] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [filter, setFilter] = useState('all')

  const list = (data ?? []).filter((m) => filter === 'all' || !m.is_read)
  const unread = (data ?? []).filter((m) => !m.is_read).length

  const setRead = (m, is_read) =>
    update.mutate({ id: m.id, is_read }, { onError: (e) => toast(errorMessage(e), 'error') })

  const toggle = (m) => {
    setOpen((o) => (o === m.id ? null : m.id))
    if (!m.is_read) setRead(m, true)
  }

  const onDelete = async () => {
    try {
      await remove.mutateAsync(toDelete.id)
      toast('Message deleted')
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Messages"
        description={`From the contact form on the site. ${unread} unread.`}
        actions={
          <div
            role="group"
            aria-label="Filter messages"
            className="border-line flex rounded-full border p-1"
          >
            {['all', 'unread'].map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  'min-h-9 rounded-full px-4 text-sm capitalize transition-colors',
                  filter === f ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />
      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}
      {error && <ErrorNote what="messages" />}
      {!isLoading && list.length === 0 && (
        <div className="border-line text-muted rounded-xl border border-dashed p-10 text-center text-sm">
          {filter === 'unread'
            ? 'You’re all caught up.'
            : 'No messages yet. They’ll show up here when someone uses the contact form.'}
        </div>
      )}
      <ul className="space-y-2">
        {list.map((m) => {
          const isOpen = open === m.id
          return (
            <li
              key={m.id}
              className={cn(
                'border-line bg-surface rounded-xl border',
                !m.is_read && 'border-l-accent border-l-2',
              )}
            >
              <button
                type="button"
                onClick={() => toggle(m)}
                aria-expanded={isOpen}
                aria-controls={`msg-${m.id}`}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
                {m.is_read ? (
                  <MailOpen size={17} className="text-muted mt-0.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Mail size={17} className="text-accent mt-0.5 shrink-0" aria-label="Unread" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    <span className={cn('truncate', !m.is_read && 'font-semibold')}>{m.name}</span>
                    <span className="text-muted truncate text-xs">{m.email}</span>
                  </span>
                  {!isOpen && <span className="text-muted line-clamp-1 text-sm">{m.message}</span>}
                </span>
                <span className="text-muted hidden shrink-0 text-xs sm:block">
                  {fmt(m.created_at)}
                </span>
                <ChevronDown
                  size={16}
                  className={cn(
                    'text-muted mt-0.5 shrink-0 transition-transform',
                    isOpen && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div id={`msg-${m.id}`} className="border-line border-t px-4 pt-4 pb-4 sm:pl-12">
                  <p className="text-muted mb-3 text-xs sm:hidden">{fmt(m.created_at)}</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`}
                    >
                      <Reply size={15} aria-hidden="true" /> Reply
                    </Button>
                    <Button variant="ghost" onClick={() => setRead(m, !m.is_read)}>
                      {m.is_read ? 'Mark unread' : 'Mark read'}
                    </Button>
                    <Button variant="subtle" onClick={() => setToDelete(m)}>
                      <Trash2 size={15} aria-hidden="true" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        title="Delete this message?"
        message={`The message from ${toDelete?.name} is deleted for good.`}
      />
    </div>
  )
}
