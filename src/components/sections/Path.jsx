import { ArrowUpRight } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import Reveal from '../ui/Reveal'
import { SkeletonText } from '../ui/Skeleton'
import ErrorNote from '../ui/ErrorNote'
import { alsoShipped, education, experiences } from '../../hooks/queries'
import { formatMonthYear } from '../../lib/utils'

function SubHeading({ children }) {
  return (
    <h3 className="text-muted mb-6 font-mono text-[11px] tracking-[0.2em] uppercase">{children}</h3>
  )
}

function Experience() {
  const { data, isLoading, error } = experiences.useList()
  if (isLoading) return <SkeletonText lines={6} />
  if (error) return <ErrorNote what="experience" />
  return (
    <ol className="border-line relative space-y-12 border-l pl-8">
      {data?.map((e, i) => (
        <Reveal as="li" key={e.id} delay={i * 0.05} className="relative">
          <span
            aria-hidden="true"
            className={`border-bg absolute top-1.5 -left-[2.4rem] size-3 rounded-full border-2 ${e.is_current ? 'bg-accent' : 'bg-line'}`}
          />
          <p className="text-muted font-mono text-xs">
            {formatMonthYear(e.start_date)} –{' '}
            {e.is_current ? 'Present' : formatMonthYear(e.end_date)}
          </p>
          <h4 className="font-display mt-2 text-2xl">{e.role}</h4>
          <p className="text-muted">{e.company}</p>
          {e.bullets?.length > 0 && (
            <ul className="text-muted mt-4 space-y-2 text-sm leading-relaxed">
              {e.bullets.map((b, j) => (
                <li key={j} className="flex gap-3">
                  <span
                    className="bg-accent mt-2 size-1 shrink-0 rounded-full"
                    aria-hidden="true"
                  />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      ))}
    </ol>
  )
}

function Education() {
  const { data, isLoading, error } = education.useList()
  if (isLoading) return <SkeletonText lines={2} />
  if (error) return <ErrorNote what="education" />
  return (
    <ul className="space-y-6">
      {data?.map((e) => (
        <Reveal as="li" key={e.id} className="border-line border-t pt-5">
          <h4 className="font-medium">{e.degree}</h4>
          <p className="text-muted text-sm">{e.institution}</p>
          <p className="text-muted mt-1 font-mono text-xs">
            {[e.start_year, e.end_year].filter(Boolean).join(' – ')}
          </p>
        </Reveal>
      ))}
    </ul>
  )
}

function AlsoShipped() {
  const { data, isLoading, error } = alsoShipped.useList()
  if (isLoading) return <SkeletonText lines={3} />
  if (error) return <ErrorNote what="side projects" />
  return (
    <ul>
      {data?.map((p) => {
        const inner = (
          <>
            <span className="font-medium">{p.title}</span>
            <span className="text-muted text-sm">{p.description}</span>
          </>
        )
        return (
          <li key={p.id} className="border-line border-t">
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group hover:text-accent flex min-h-12 flex-col gap-1 py-4 transition-colors"
              >
                <span className="flex items-center gap-1">
                  {inner}
                  <ArrowUpRight size={14} aria-hidden="true" className="ml-auto shrink-0" />
                </span>
              </a>
            ) : (
              <div className="flex flex-col gap-1 py-4">{inner}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function Path() {
  return (
    <section
      id="experience"
      aria-labelledby="path-title"
      className="px-3 py-6 sm:px-5 md:px-8 md:py-10"
    >
      <div className="glass mx-auto max-w-7xl px-5 py-14 sm:px-8 md:px-12 md:py-20">
        <SectionHeading
          index="04"
          label="Path"
          title="Where I've worked and studied"
          id="path-title"
        />
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16 [&>*]:min-w-0">
          <div className="lg:col-span-7">
            <SubHeading>Experience</SubHeading>
            <Experience />
          </div>
          <div className="space-y-14 lg:col-span-5">
            <div>
              <SubHeading>Education</SubHeading>
              <Education />
            </div>
            <div>
              <SubHeading>Also shipped</SubHeading>
              <AlsoShipped />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
