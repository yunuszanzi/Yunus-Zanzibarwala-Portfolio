import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ExternalLink, LogOut, Menu, X } from 'lucide-react'
import ThemeToggle from '../layout/ThemeToggle'
import { ADMIN_NAV } from '../../lib/adminNav'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { chats, messages } from '../../hooks/queries'
import { cn } from '../../lib/utils'

function SidebarNav({ unread, onNavigate }) {
  return (
    <nav aria-label="Admin" className="space-y-0.5 p-3">
      {ADMIN_NAV.map(({ path, label, icon: Icon, end }) => (
        <NavLink
          key={label}
          to={path ? `/admin/${path}` : '/admin'}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
              isActive
                ? 'bg-surface-2 text-fg font-medium'
                : 'text-muted hover:text-fg hover:bg-surface-2/60',
            )
          }
        >
          <Icon size={17} aria-hidden="true" />
          {label}
          {unread[path] > 0 && (
            <span className="bg-accent text-accent-fg ml-auto rounded-full px-2 py-0.5 font-mono text-[11px]">
              {unread[path]}
              <span className="sr-only"> unread</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/** Admin shell: sidebar (drawer on mobile) + top bar with View site and Log out. */
export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { data: inbox } = messages.useList()
  const { data: chatList } = chats.useList()
  const countUnread = (rows) => rows?.filter((r) => !r.is_read).length ?? 0
  const unread = { messages: countUnread(inbox), chats: countUnread(chatList) }

  useEffect(() => setOpen(false), [location.pathname])

  const logout = async () => {
    await signOut()
    toast('Logged out')
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <Helmet>
        <title>Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <a
        href="#admin-main"
        className="bg-accent text-accent-fg fixed top-2 left-2 z-[60] -translate-y-20 rounded-full px-4 py-2 text-sm font-medium focus:translate-y-0"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="border-line bg-surface sticky top-0 hidden h-screen overflow-y-auto border-r lg:block">
        <div className="border-line flex h-16 items-center border-b px-6">
          <span className="font-display text-lg">
            Admin<span className="text-accent">.</span>
          </span>
        </div>
        <SidebarNav unread={unread} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Admin menu"
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="border-line bg-surface absolute inset-y-0 left-0 w-72 overflow-y-auto border-r">
            <div className="border-line flex h-16 items-center justify-between border-b px-5">
              <span className="font-display text-lg">Admin</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-muted hover:text-fg inline-flex size-11 items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarNav unread={unread} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="border-line bg-bg/80 sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="border-line text-muted hover:text-fg inline-flex size-11 items-center justify-center rounded-lg border lg:hidden"
          >
            <Menu size={18} />
          </button>
          <p className="text-muted hidden truncate text-sm sm:block">{user?.email}</p>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-fg hover:bg-surface-2 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors"
            >
              <ExternalLink size={15} aria-hidden="true" />
              <span className="hidden sm:inline">View site</span>
              <span className="sr-only sm:hidden">View site (opens in a new tab)</span>
            </a>
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="border-line hover:border-muted inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors"
            >
              <LogOut size={15} aria-hidden="true" />
              Log out
            </button>
          </div>
        </header>
        <main
          id="admin-main"
          tabIndex={-1}
          className="flex-1 px-4 py-8 outline-none md:px-8 md:py-10"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
