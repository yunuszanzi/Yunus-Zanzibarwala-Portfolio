import SectionHeading from '../ui/SectionHeading'
import Reveal from '../ui/Reveal'
import ChipList from '../ui/ChipList'
import Skeleton from '../ui/Skeleton'
import ErrorNote from '../ui/ErrorNote'
import { skillGroups } from '../../hooks/queries'

export default function Skills() {
  const { data, isLoading, error } = skillGroups.useList()

  return (
    <section
      id="skills"
      aria-labelledby="skills-title"
      className="px-3 py-6 sm:px-5 md:px-8 md:py-10"
    >
      <div className="glass mx-auto max-w-7xl px-5 py-14 sm:px-8 md:px-12 md:py-20">
        <SectionHeading index="03" label="Skills" title="Tools I reach for" id="skills-title" />
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        )}
        {error && <ErrorNote what="skills" />}
        <ul className="grid gap-4 md:grid-cols-2">
          {data?.map((g, i) => (
            <Reveal
              as="li"
              key={g.id}
              delay={i * 0.05}
              className="border-line bg-surface/60 hover:border-muted/60 rounded-2xl border p-6 transition-colors md:p-7"
            >
              <div className="mb-5 flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl">{g.name}</h3>
                <span className="text-muted font-mono text-[11px] tracking-[0.15em] uppercase">
                  {g.skills.length} {g.skills.length === 1 ? 'tool' : 'tools'}
                </span>
              </div>
              <ChipList items={g.skills} limit={14} label={`${g.name} skills`} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
