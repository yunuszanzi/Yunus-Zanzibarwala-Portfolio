import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { cn, stepCaption } from '../../lib/utils'

// Vertical scroll distance per screenshot, in viewport heights.
const VH_PER_STEP = 55
// How many earlier cards stay visible behind the top one.
const MAX_DEPTH = 3
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * One card in the pile. `t` runs from 0 to n-1 as the section scrolls:
 * card i slides up from below while t goes i-1 -> i, then shrinks and lifts
 * slightly as later cards land on top of it.
 */
function StackCard({ image, index, t, title }) {
  const y = useTransform(t, (v) => {
    const enter = index === 0 ? 1 : clamp(v - (index - 1), 0, 1)
    const depth = clamp(v - index, 0, MAX_DEPTH)
    return `${(1 - enter) * 115 - depth * 6}%`
  })
  const scale = useTransform(t, (v) => 1 - clamp(v - index, 0, MAX_DEPTH) * 0.06)
  // Hidden until its turn (fades in over the first quarter of its rise), and hidden again
  // once it's buried deeper than MAX_DEPTH.
  const opacity = useTransform(t, (v) => {
    if (v - index > MAX_DEPTH) return 0
    if (index === 0) return 1
    return clamp((v - (index - 1)) * 4, 0, 1)
  })
  const dim = useTransform(t, (v) => clamp(v - index, 0, MAX_DEPTH) * 0.18)

  return (
    <motion.figure
      style={{ y, scale, opacity, zIndex: index }}
      className="border-line bg-surface absolute inset-0 origin-top overflow-hidden rounded-2xl border shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.45)]"
    >
      <img
        src={image.image_url}
        alt={image.caption || `${title} screenshot ${index + 1}`}
        loading={index === 0 ? 'eager' : 'lazy'}
        decoding="async"
        width="1600"
        height="900"
        className="size-full object-contain"
      />
      {/* Darkens cards as they sink into the pile */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: dim }}
        className="absolute inset-0 bg-black"
      />
    </motion.figure>
  )
}

/**
 * Desktop gallery where screenshots pile up as you scroll.
 * @param {{ images: any[], title: string }} props
 */
export default function StackGallery({ images, title }) {
  const ref = useRef(null)
  const n = images.length
  const [active, setActive] = useState(0)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.3 })
  const t = useTransform(smooth, (v) => v * (n - 1))

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = clamp(Math.round(v * (n - 1)), 0, n - 1)
    setActive((prev) => (prev === next ? prev : next))
  })

  const goTo = (i) => {
    const el = ref.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const range = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + (range * i) / (n - 1), behavior: 'smooth' })
  }

  return (
    <div
      ref={ref}
      className="relative"
      style={{ height: `calc(${(n - 1) * VH_PER_STEP}vh + 100vh)` }}
      data-testid="scroll-gallery"
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center overflow-hidden py-6">
        <div className="grid w-full items-center gap-10 lg:grid-cols-12">
          <ol className="hidden space-y-1 lg:col-span-4 lg:block" aria-label={`${title} steps`}>
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

          <div className="lg:col-span-8">
            {/* Top padding leaves room for the earlier cards peeking out above the top one. */}
            <div className="mx-auto w-full max-w-[min(44rem,calc((100vh-18rem)*16/9))] pt-12">
              <div className="relative aspect-video">
                {images.map((img, i) => (
                  <StackCard key={img.id} image={img} index={i} t={t} title={title} />
                ))}
              </div>
              <p className="text-muted mt-5 font-mono text-xs" aria-live="polite">
                {stepCaption(active, n, images[active])}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
