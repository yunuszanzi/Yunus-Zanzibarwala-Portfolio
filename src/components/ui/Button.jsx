import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

const variants = {
  primary: 'bg-accent text-accent-fg hover:brightness-110',
  ghost: 'border border-line text-fg hover:border-muted hover:bg-surface-2',
  subtle: 'text-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-red-700 text-white hover:bg-red-800',
}

/**
 * Renders a router <Link> when `to` is set, an <a> when `href` is set, otherwise a <button>.
 * @param {{ variant?: 'primary'|'ghost'|'subtle'|'danger', to?: string, href?: string, className?: string }} props
 */
export default function Button({ variant = 'primary', to, href, className, children, ...rest }) {
  const classes = cn(base, variants[variant], className)
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}
