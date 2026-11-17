import { useState } from 'react'
import { Bot, ChevronDown, MessagesSquare, Trash2, User } from 'lucide-react'
import PageHeader from '../../components/admin/PageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Skeleton from '../../components/ui/Skeleton'
import ErrorNote from '../../components/ui/ErrorNote'
import Button from '../../components/ui/Button'
import { chats } from '../../hooks/queries'
import { useToast } from '../../hooks/useToast'
import { cn, errorMessage } from '../../lib/utils'

const fmt = (d) =>
  new Date(d).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

/** Conversations from the site chat. Opening one marks it read. */
export default function Chats() {
  const { data, isLoading, error } = chats.useList()
  const update = chats.useUpdate()
  const remove = chats.useRemove()
  const toast = useToast()
  const [open, setOpen] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const unread = (data ?? []).filter((c) => !c.is_read).length

  const toggle = (c) => {
    setOpen((o) => (o === c.id ? null : c.id))
    if (!c.is_read) {
      update.mutate(
        { id: c.id, is_read: true },
        { onError: (e) => toast(errorMessage(e), 'error') },
      )
    }
  }

  const onDelete = async () => {
    try {
      await remove.mutateAsync(toDelete.id)
      toast('Chat deleted')
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Chats"
        description={`Conversations with the site assistant. ${unread} unread. Visitors who want a reply usually tap “Continue on WhatsApp”, so check WhatsApp too.`}
      />
      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}
      {error && <ErrorNote what="chats" />}
      {!isLoading && !error && data?.length === 0 && (
        <div className="border-line text-muted rounded-xl border border-dashed p-10 text-center text-sm">
          No chats yet. They show up here as soon as a visitor talks to the assistant.
        </div>
      )}
      <ul className="space-y-2">
        {data?.map((c) => {
          const msgs = c.transcript ?? []
          const firstUser = msgs.find((m) => m.from === 'user')?.text ?? ''
          const unanswered = msgs.some((m, i) => m.from === 'user' && msgs[i + 1]?.fallback)
          const isOpen = open === c.id
          return (
            <li
              key={c.id}
              className={cn(
                'border-line bg-surface rounded-xl border',
                !c.is_read && 'border-l-accent border-l-2',
              )}
            >
              <button
                type="button"
                onClick={() => toggle(c)}
                aria-expanded={isOpen}
                aria-controls={`chat-${c.id}`}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
                <MessagesSquare
                  size={17}
                  className={cn('mt-0.5 shrink-0', c.is_read ? 'text-muted' : 'text-accent')}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className={cn('line-clamp-1', !c.is_read && 'font-semibold')}>
                    {firstUser || 'Empty chat'}
                  </span>
                  <span className="text-muted text-xs">
                    {msgs.length} messages{!c.is_read && ' · unread'}
                  </span>
                </span>
                <span className="text-muted shrink-0 text-xs">{fmt(c.updated_at)}</span>
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
                <div id={`chat-${c.id}`} className="border-line space-y-3 border-t p-4">
                  {unanswered && (
                    <p className="text-muted text-xs">
                      Some questions had no matching answer. Consider adding them in Chat replies.
                    </p>
                  )}
                  <ol className="space-y-2">
                    {msgs.map((m, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        {m.from === 'user' ? (
                          <User
                            size={15}
                            className="text-accent mt-0.5 shrink-0"
                            aria-label="Visitor"
                          />
                        ) : (
                          <Bot
                            size={15}
                            className="text-muted mt-0.5 shrink-0"
                            aria-label="Assistant"
                          />
                        )}
                        <p className={cn('whitespace-pre-wrap', m.from === 'bot' && 'text-muted')}>
                          {m.text}
                        </p>
                      </li>
                    ))}
                  </ol>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => update.mutate({ id: c.id, is_read: !c.is_read })}
                    >
                      {c.is_read ? 'Mark unread' : 'Mark read'}
                    </Button>
                    <Button variant="subtle" onClick={() => setToDelete(c)}>
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
        title="Delete this chat?"
        message="The conversation is deleted for good."
      />
    </div>
  )
}
