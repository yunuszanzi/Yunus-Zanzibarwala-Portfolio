import SectionHeading from '../ui/SectionHeading'
import Reveal from '../ui/Reveal'
import Chip from '../ui/Chip'
import Skeleton from '../ui/Skeleton'
import ErrorNote from '../ui/ErrorNote'
import { skillGroups } from '../../hooks/queries'

export default function Skills() {
  const { data, isLoading, error } = skillGroups.useList()

  return (
    <section id="skills" aria-labelledby="skills-title" className="px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading index="03" label="Skills" title="Tools I reach for" id="skills-title" />
        {isLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        )}
        {error && <ErrorNote what="skills" />}
        <ul>
          {data?.map((g, i) => (
            <Reveal
              as="li"
              key={g.id}
              delay={i * 0.04}
              className="border-line grid gap-4 border-t py-8 md:grid-cols-12"
            >
              <h3 className="font-display text-2xl md:col-span-4">{g.name}</h3>
              <ul className="flex flex-wrap gap-2 md:col-span-8">
                {g.skills.map((s) => (
                  <li key={s}>
                    <Chip className="text-fg px-4 py-1.5 text-sm">{s}</Chip>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
