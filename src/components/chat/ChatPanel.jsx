import { useEffect, useRef, useState } from 'react'
import { MessageCircle, RotateCcw, Send, X } from 'lucide-react'
import { chatReplies, saveChat } from '../../hooks/queries'
import { findReply, whatsappLink } from '../../lib/chatEngine'
import { loadConversation, newConversation, storeConversation } from './chatStore'
import { cn } from '../../lib/utils'

const TYPING_MS = 650
const SAVE_DEBOUNCE_MS = 1200
const MAX_INPUT = 1000

function Bubble({ from, children }) {
  return (
    <div className={cn('flex', from === 'user' ? 'justify-end' : 'justify-start')}>
      <p
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          from === 'user'
            ? 'bg-accent text-accent-fg rounded-br-md'
            : 'bg-surface-2 text-fg rounded-bl-md',
        )}
      >
        {children}
      </p>
    </div>
  )
}

/**
 * The chat window. Answers come from the predefined replies (editable in /admin); anything
 * unmatched gets the fallback message and a WhatsApp button. The conversation is saved to
 * Supabase (owner-only inbox) and kept in localStorage.
 * @param {{ open: boolean, settings: any, onClose: () => void }} props
 */
export default function ChatPanel({ open, settings, onClose }) {
  const { data: replies } = chatReplies.useList()
  const [conv, setConv] = useState(loadConversation)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const inputRef = useRef(null)
  const logRef = useRef(null)
  const saveTimer = useRef()

  const messages = conv.messages
  const asked = new Set(messages.filter((m) => m.from === 'user').map((m) => m.text.toLowerCase()))
  const suggestions = (replies ?? [])
    .filter((r) => r.label && !asked.has(r.label.toLowerCase()))
    .slice(0, messages.length ? 3 : 6)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages.length, typing, open])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const update = (next) => {
    setConv(next)
    storeConversation(next)
    if (!next.messages.some((m) => m.from === 'user')) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      // `fallback` marks questions with no answer, so the admin inbox can flag them.
      const transcript = next.messages.map(({ from, text, at, fallback }) =>
        fallback ? { from, text, at, fallback: true } : { from, text, at },
      )
      // Saving is best-effort: the visitor can always use WhatsApp instead.
      saveChat({ id: next.id, token: next.token, transcript: transcript.slice(-200) }).catch(
        () => {},
      )
    }, SAVE_DEBOUNCE_MS)
  }

  const send = (raw) => {
    const text = raw.trim().slice(0, MAX_INPUT)
    if (!text || typing) return
    const withUser = {
      ...conv,
      messages: [...messages, { from: 'user', text, at: new Date().toISOString() }],
    }
    update(withUser)
    setDraft('')
    setTyping(true)
    setTimeout(() => {
      const match = findReply(replies ?? [], text)
      const bot = {
        from: 'bot',
        text: match ? match.answer : settings.chat_fallback,
        at: new Date().toISOString(),
        fallback: !match,
      }
      update({ ...withUser, messages: [...withUser.messages, bot] })
      setTyping(false)
    }, TYPING_MS)
  }

  const restart = () => {
    clearTimeout(saveTimer.current)
    update(newConversation())
    inputRef.current?.focus()
  }

  const waHref = whatsappLink(settings.phone, messages)
  const last = messages.at(-1)

  return (
    <section
      id="chat-panel"
      role="dialog"
      aria-label="Chat with Yunus’s assistant"
      hidden={!open}
      // The `flex` class would override the hidden attribute, so hide it explicitly too.
      style={open ? undefined : { display: 'none' }}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="border-line bg-surface fixed inset-x-3 bottom-22 z-[60] flex h-[min(560px,calc(100svh-7.5rem))] flex-col overflow-hidden rounded-2xl border shadow-2xl shadow-black/40 sm:inset-x-auto sm:right-4 sm:w-[380px] md:right-6 md:bottom-24"
    >
      <header className="border-line flex items-center gap-3 border-b px-4 py-3">
        <span className="bg-accent/15 text-accent inline-flex size-9 items-center justify-center rounded-full">
          <MessageCircle size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium">Yunus’s assistant</h2>
          <p className="text-muted truncate text-xs">
            Instant answers · Yunus follows up personally
          </p>
        </div>
        <button
          type="button"
          onClick={restart}
          aria-label="Start a new chat"
          className="text-muted hover:text-fg hover:bg-surface-2 inline-flex size-9 items-center justify-center rounded-lg"
        >
          <RotateCcw size={16} />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="text-muted hover:text-fg hover:bg-surface-2 inline-flex size-9 items-center justify-center rounded-lg"
        >
          <X size={18} />
        </button>
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        <Bubble from="bot">{settings.chat_greeting}</Bubble>
        {messages.map((m, i) => (
          <Bubble key={i} from={m.from}>
            {m.text}
          </Bubble>
        ))}
        {typing && (
          <p className="text-muted text-xs" aria-label="Assistant is typing">
            typing…
          </p>
        )}
        {last?.fallback && !typing && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-accent-fg inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium hover:brightness-110"
          >
            <MessageCircle size={15} aria-hidden="true" /> Send this chat on WhatsApp
          </a>
        )}
      </div>

      {suggestions.length > 0 && !typing && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2" aria-label="Suggested questions">
          {suggestions.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => send(r.label)}
              className="border-line text-muted hover:text-fg hover:border-muted shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(draft)
        }}
        className="border-line flex items-center gap-2 border-t p-3"
      >
        <label htmlFor="chat-input" className="sr-only">
          Type a message
        </label>
        <input
          ref={inputRef}
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_INPUT}
          autoComplete="off"
          placeholder="Ask a question…"
          className="border-line bg-bg text-fg placeholder:text-muted/70 focus:border-accent min-h-10 flex-1 rounded-full border px-4 text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || typing}
          aria-label="Send message"
          className="bg-accent text-accent-fg inline-flex size-10 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </form>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted hover:text-fg border-line border-t py-2.5 text-center text-xs transition-colors"
      >
        Continue on WhatsApp →
      </a>
    </section>
  )
}
