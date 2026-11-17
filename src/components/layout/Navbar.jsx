import { useEffect, useState } from 'react'
import { Menu, Search, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import Button from '../ui/Button'
import { SECTIONS, scrollToId } from '../../lib/sections'
import { useScrollSpy } from '../../hooks/useScrollSpy'
import { cn } from '../../lib/utils'

/**
 * @param {{ siteName: string, shortName: string, email?: string, onOpenPalette: () => void }} props
 */
export default function Navbar({ shortName, email, onOpenPalette }) {
  // 'top' (the hero) is tracked too, so no link stays highlighted after scrolling back up.
  const active = useScrollSpy(['top', ...SECTIONS.map((s) => s.id)])
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (e, id) => {
    e.preventDefault()
    setOpen(false)
    scrollToId(id)
  }

  return (
    <>
      <a
        href="#main"
        className="bg-accent text-accent-fg fixed top-2 left-2 z-[60] -translate-y-20 rounded-full px-4 py-2 text-sm font-medium focus:translate-y-0"
      >
        Skip to content
      </a>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300',
          scrolled || open
            ? 'border-line bg-bg/75 backdrop-blur-xl'
            : 'border-transparent bg-transparent',
        )}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:px-8"
        >
          <a
            href="#top"
            onClick={(e) => go(e, 'top')}
            className="font-display text-lg font-semibold tracking-tight"
          >
            {shortName}
            <span className="text-accent">.</span>
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => go(e, s.id)}
                  aria-current={active === s.id ? 'true' : undefined}
                  className={cn(
                    'rounded-full px-3 py-2 text-sm transition-colors',
                    active === s.id ? 'text-fg bg-surface-2' : 'text-muted hover:text-fg',
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPalette}
              className="border-line text-muted hover:text-fg hover:border-muted hidden min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors sm:inline-flex"
            >
              <Search size={15} aria-hidden="true" />
              Search
              <kbd className="bg-surface-2 rounded px-1.5 py-0.5 font-mono text-[11px]">Ctrl K</kbd>
            </button>
            <button
              type="button"
              onClick={onOpenPalette}
              aria-label="Open search"
              className="border-line text-muted hover:text-fg inline-flex size-11 items-center justify-center rounded-full border sm:hidden"
            >
              <Search size={18} />
            </button>
            <ThemeToggle />
            {email && (
              <div className="hidden md:block">
                <Button href={`mailto:${email}`}>Say hello</Button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="border-line text-muted hover:text-fg inline-flex size-11 items-center justify-center rounded-full border lg:hidden"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {open && (
          <ul id="mobile-menu" className="border-line space-y-1 border-t px-5 py-4 lg:hidden">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => go(e, s.id)}
                  className="hover:bg-surface-2 block rounded-lg px-3 py-3 text-base"
                >
                  {s.label}
                </a>
              </li>
            ))}
            {email && (
              <li className="pt-2">
                <Button href={`mailto:${email}`} className="w-full">
                  Say hello
                </Button>
              </li>
            )}
          </ul>
        )}
      </header>
    </>
  )
}
