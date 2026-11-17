import { lazy, Suspense, useRef, useState } from 'react'
import { Loader2, MessageCircle, X } from 'lucide-react'

// The panel (and the Supabase client it needs) only loads when someone opens the chat.
const ChatPanel = lazy(() => import('./ChatPanel'))

/**
 * Floating chat button (bottom-right) that opens the rule-based assistant.
 * Hidden when the chat is switched off in Settings, or before the chat migration
 * (0002_chat.sql) has been run (settings.chat_enabled is then undefined).
 * @param {{ settings: any }} props
 */
export default function ChatLauncher({ settings }) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const buttonRef = useRef(null)

  if (!settings || settings.chat_enabled !== true) return null

  const toggle = () => {
    setLoaded(true)
    setOpen((o) => !o)
  }
  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <>
      {loaded && (
        <Suspense
          fallback={
            open && (
              <div className="border-line bg-surface fixed right-4 bottom-24 z-[60] flex size-14 items-center justify-center rounded-2xl border shadow-xl">
                <Loader2 size={20} className="text-muted animate-spin" aria-label="Loading chat" />
              </div>
            )
          }
        >
          <ChatPanel open={open} settings={settings} onClose={close} />
        </Suspense>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? 'Close chat' : 'Chat with Yunus’s assistant'}
        className="bg-accent text-accent-fg fixed right-4 bottom-4 z-[60] inline-flex size-14 items-center justify-center rounded-full shadow-lg shadow-black/30 transition-transform hover:scale-105 active:scale-95 md:right-6 md:bottom-6"
      >
        {open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={24} aria-hidden="true" />}
      </button>
    </>
  )
}
