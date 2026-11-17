import SimpleMarkdown from '../ui/SimpleMarkdown'
import SectionHeading from '../ui/SectionHeading'
import Reveal from '../ui/Reveal'
import Skeleton, { SkeletonText } from '../ui/Skeleton'
import ErrorNote from '../ui/ErrorNote'
import { services as serviceHooks, stats as statHooks } from '../../hooks/queries'

/** @param {{ settings: any, loading: boolean }} props */
export default function About({ settings, loading }) {
  const statsQ = statHooks.useList()
  const servicesQ = serviceHooks.useList()

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="px-3 py-6 sm:px-5 md:px-8 md:py-10"
    >
      <div className="glass mx-auto max-w-7xl px-5 py-14 sm:px-8 md:px-12 md:py-20">
        <SectionHeading
          index="02"
          label="About"
          title={settings?.about_headline || 'About me'}
          id="about-title"
        />

        <div className="grid gap-x-6 gap-y-12 md:grid-cols-12 lg:gap-x-12 [&>*]:min-w-0">
          <Reveal className="text-muted [&_a]:text-fg [&_strong]:text-fg space-y-5 text-lg leading-relaxed md:col-span-7 [&_a]:underline">
            {loading ? (
              <SkeletonText lines={6} />
            ) : (
              <SimpleMarkdown>{settings?.about_paragraphs ?? ''}</SimpleMarkdown>
            )}
          </Reveal>

          <div className="md:col-span-5">
            <h3 className="text-muted mb-6 font-mono text-[11px] tracking-[0.2em] uppercase">
              What I do
            </h3>
            {servicesQ.isLoading && <SkeletonText lines={4} />}
            {servicesQ.error && <ErrorNote what="services" />}
            <ul className="space-y-6">
              {servicesQ.data?.map((s, i) => (
                <Reveal as="li" key={s.id} delay={i * 0.05} className="border-line border-t pt-5">
                  <h4 className="font-display text-xl">{s.title}</h4>
                  <p className="text-muted mt-2 text-sm leading-relaxed">{s.description}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-20">
          {statsQ.isLoading && (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          )}
          {statsQ.error && <ErrorNote what="stats" />}
          {statsQ.data?.length > 0 && (
            <dl className="border-line grid grid-cols-2 border-t md:grid-cols-4">
              {statsQ.data.map((s, i) => (
                <Reveal
                  key={s.id}
                  delay={i * 0.06}
                  className="border-line flex flex-col-reverse gap-2 border-b py-8 pr-4 md:border-r md:border-b-0 md:pl-6 md:first:pl-0 md:last:border-r-0"
                >
                  <dt className="text-muted text-sm">{s.label}</dt>
                  <dd className="font-display text-5xl tracking-tight md:text-6xl">{s.value}</dd>
                </Reveal>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  )
}
