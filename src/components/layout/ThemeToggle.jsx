import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

/**
 * Both icons are rendered; CSS shows the right one from <html data-theme>. That keeps the
 * pre-rendered HTML identical to the first client render whatever theme the visitor uses.
 */
export default function ThemeToggle() {
  const [, toggle] = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      className="border-line text-muted hover:text-fg hover:border-muted inline-flex size-11 items-center justify-center rounded-full border transition-colors"
    >
      <Sun size={18} className="theme-icon-dark" aria-hidden="true" />
      <Moon size={18} className="theme-icon-light" aria-hidden="true" />
    </button>
  )
}
