import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion'
import { cn, stepCaption } from '../../lib/utils'

// Vertical scroll distance per screenshot, in viewport heights.
const VH_PER_STEP = 70

/**
 * Desktop gallery that advances as the user scrolls. The frame sticks below the navbar
 * while the tall wrapper scrolls past; scroll progress picks the active screenshot.
 * @param {{ images: any[], title: string }} props
 */
export default function ScrollGallery({ images, title }) {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const n = images.length

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40, mass: 0.3 })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(n - 1, Math.max(0, Math.floor(v * n)))
    setActive((prev) => (prev === next ? prev : next))
  })

  /** Scroll the window so step `i` is centred in its slice of the scroll range. */
  const goTo = (i) => {
    const el = ref.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const range = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + (range * (i + 0.5)) / n, behavior: 'smooth' })
  }

  return (
    <div
      ref={ref}
      className="relative"
      style={{ height: `calc(${n * VH_PER_STEP}vh + 100vh)` }}
      data-testid="scroll-gallery"
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center py-6">
        <div className="grid w-full items-center gap-8 lg:grid-cols-12">
          <ol className="hidden space-y-1 lg:col-span-3 lg:block" aria-label={`${title} steps`}>
            {images.map((img, i) => (
              <li key={img.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === active ? 'step' : undefined}
                  className={cn(
                    'w-full rounded-lg px-3 py-2.5 text-left font-mono text-xs transition-colors',
                    i === active ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg',
                  )}
                >
                  {stepCaption(i, n, img)}
                </button>
              </li>
            ))}
          </ol>

          <figure className="lg:col-span-9">
            {/* Width is capped by viewport height so the frame always stays exactly 16:9. */}
            <div className="border-line bg-surface relative mx-auto aspect-video w-full max-w-[calc((100vh-12rem)*16/9)] overflow-hidden rounded-2xl border">
              {images.map((img, i) => (
                <motion.img
                  key={img.id}
                  src={img.image_url}
                  alt={img.caption || `${title} screenshot ${i + 1}`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  width="1600"
                  height="900"
                  aria-hidden={i !== active}
                  className="absolute inset-0 size-full object-contain"
                  initial={false}
                  animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.02 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4">
              <figcaption
                className="text-muted min-w-0 flex-1 truncate font-mono text-xs"
                aria-live="polite"
              >
                {stepCaption(active, n, images[active])}
              </figcaption>
              <div className="bg-line h-px w-32 overflow-hidden rounded-full" aria-hidden="true">
                <motion.div className="bg-accent h-full origin-left" style={{ scaleX: progress }} />
              </div>
            </div>
          </figure>
        </div>
      </div>
    </div>
  )
}
