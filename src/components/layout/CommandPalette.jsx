import { useState } from 'react'
import { Command } from 'cmdk'
import { ArrowUpRight, Copy, Hash, Moon, FolderOpen } from 'lucide-react'
import { SECTIONS, scrollToId } from '../../lib/sections'
import { useTheme } from '../../hooks/useTheme'

const itemClass =
  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted data-[selected=true]:bg-surface-2 data-[selected=true]:text-fg'
const groupClass =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted'

/**
 * Ctrl/Cmd+K palette: jump to sections and projects, copy email, open social links.
 * @param {{ open: boolean, onOpenChange: (v: boolean) => void, projects?: any[], email?: string, socials?: {label:string,url:string}[] }} props
 */
export default function CommandPalette({ open, onOpenChange, projects = [], email, socials = [] }) {
  const [, toggleTheme] = useTheme()
  const [note, setNote] = useState('')

  // The Ctrl/Cmd+K shortcut lives in Home, so it works before this lazy chunk has loaded.

  const run = (fn) => () => {
    onOpenChange(false)
    // Let the dialog close before scrolling so focus returns cleanly.
    setTimeout(fn, 50)
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setNote('Email copied')
    } catch {
      setNote('Could not copy. Email: ' + email)
    }
    setTimeout(() => setNote(''), 2500)
  }

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={onOpenChange}
        label="Search the site"
        overlayClassName="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
        contentClassName="fixed left-1/2 top-[12vh] z-[71] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
      >
        <Command.Input
          placeholder="Jump to a section, project or link..."
          className="border-line text-fg placeholder:text-muted w-full border-b bg-transparent px-5 py-4 text-base outline-none"
        />
        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="text-muted px-3 py-6 text-center text-sm">
            Nothing matches that.
          </Command.Empty>
          <Command.Group heading="Sections" className={groupClass}>
            {SECTIONS.map((s) => (
              <Command.Item
                key={s.id}
                value={`section ${s.label}`}
                onSelect={run(() => scrollToId(s.id))}
                className={itemClass}
              >
                <Hash size={15} aria-hidden="true" /> {s.label}
              </Command.Item>
            ))}
          </Command.Group>
          {projects.length > 0 && (
            <Command.Group heading="Projects" className={groupClass}>
              {projects.map((p) => (
                <Command.Item
                  key={p.id}
                  value={`project ${p.title} ${p.tech?.join(' ')}`}
                  onSelect={run(() => scrollToId(`project-${p.slug}`))}
                  className={itemClass}
                >
                  <FolderOpen size={15} aria-hidden="true" /> {p.title}
                  <span className="ml-auto font-mono text-xs">{p.year}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
          <Command.Group heading="Actions" className={groupClass}>
            {email && (
              <Command.Item
                value="copy email address"
                onSelect={run(copyEmail)}
                className={itemClass}
              >
                <Copy size={15} aria-hidden="true" /> Copy email
              </Command.Item>
            )}
            <Command.Item
              value="toggle theme dark light"
              onSelect={run(toggleTheme)}
              className={itemClass}
            >
              <Moon size={15} aria-hidden="true" /> Switch theme
            </Command.Item>
            {socials.map((s) => (
              <Command.Item
                key={s.url}
                value={`open ${s.label}`}
                onSelect={run(() => window.open(s.url, '_blank', 'noopener,noreferrer'))}
                className={itemClass}
              >
                <ArrowUpRight size={15} aria-hidden="true" /> Open {s.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command.Dialog>
      <div role="status" aria-live="polite" className="sr-only">
        {note}
      </div>
      {note && (
        <div className="border-line bg-surface text-fg fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full border px-4 py-2 text-sm shadow-lg">
          {note}
        </div>
      )}
    </>
  )
}
