import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

// One shared observer for every Reveal on the page.
let observer = null
function observe(el) {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            observer.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
  }
  observer.observe(el)
  return () => observer.unobserve(el)
}

/**
 * Fades and lifts its children in when they scroll into view. Pure CSS + one shared
 * IntersectionObserver (see .reveal in index.css), so it costs almost no JavaScript, and
 * content stays visible without JS or with reduced motion.
 * @param {{ as?: string, delay?: number, className?: string, children: any }} props
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className, children }) {
  const ref = useRef(null)
  useEffect(() => (ref.current ? observe(ref.current) : undefined), [])
  return (
    <Tag
      ref={ref}
      className={cn('reveal', className)}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  )
}
