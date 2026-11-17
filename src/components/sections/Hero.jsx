import { ArrowDown } from 'lucide-react'
import Button from '../ui/Button'
import Skeleton, { SkeletonText } from '../ui/Skeleton'
import { scrollToId } from '../../lib/sections'

function InfoItem({ label, value }) {
  if (!value) return null
  return (
    <div className="border-line border-t pt-4">
      <dt className="text-muted mb-1 font-mono text-[11px] tracking-[0.2em] uppercase">{label}</dt>
      <dd className="text-fg text-sm leading-relaxed">{value}</dd>
    </div>
  )
}

// CSS entrance (see .rise-in in index.css) so it plays on pre-rendered HTML without JS.
// The headline is the LCP element, so it isn't animated: it paints immediately.
const rise = (delay) => ({ style: { animationDelay: `${delay}s` } })

/** @param {{ settings: any, loading: boolean }} props */
export default function Hero({ settings, loading }) {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-5 pt-28 pb-12 md:px-8 md:pb-16"
    >
      {/* Glow drifts toward the cursor (--mx/--my are set by ConstellationBackground). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] size-[42rem] rounded-full opacity-[0.12] blur-3xl transition-transform duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, var(--accent), transparent 65%)',
          transform: 'translate3d(calc(var(--mx, 0) * 60px), calc(var(--my, 0) * 60px), 0)',
        }}
      />
      <div className="relative mx-auto w-full max-w-7xl">
        {loading || !settings ? (
          <div className="space-y-6">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-20 w-full max-w-4xl md:h-36" />
            <SkeletonText lines={2} className="max-w-xl" />
            <h1 id="hero-title" className="sr-only">
              Loading
            </h1>
          </div>
        ) : (
          <>
            <p
              {...rise(0)}
              className="rise-in text-muted mb-6 font-mono text-xs tracking-[0.2em] uppercase"
            >
              {settings.hero_eyebrow}
            </p>
            <h1
              id="hero-title"
              className="font-display max-w-5xl text-[2.6rem] leading-[1.02] tracking-tight text-balance sm:text-6xl md:text-7xl lg:text-8xl"
            >
              {settings.hero_headline}
            </h1>
            <p
              {...rise(0.12)}
              className="rise-in text-muted mt-8 max-w-xl text-lg leading-relaxed text-pretty"
            >
              {settings.hero_subheading}
            </p>
            <div {...rise(0.2)} className="rise-in mt-10 flex flex-wrap gap-3">
              <Button
                href="#work"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToId('work')
                }}
              >
                {settings.cta_primary_label}
                <ArrowDown size={16} aria-hidden="true" />
              </Button>
              {settings.email && (
                <Button variant="ghost" href={`mailto:${settings.email}`}>
                  {settings.cta_secondary_label}
                </Button>
              )}
            </div>
            <dl {...rise(0.28)} className="rise-in mt-16 grid gap-6 sm:grid-cols-3 md:mt-24">
              <InfoItem label="Now" value={settings.now_text} />
              <InfoItem label="Based" value={settings.based_text} />
              <InfoItem label="Open to" value={settings.open_to_text} />
            </dl>
          </>
        )}
      </div>
    </section>
  )
}
