import { useMemo } from 'react'
import SectionHeading from '../ui/SectionHeading'
import Skeleton from '../ui/Skeleton'
import ErrorNote from '../ui/ErrorNote'
import Reveal from '../ui/Reveal'
import ProjectShowcase from './ProjectShowcase'
import { categories as categoryHooks, useProjects } from '../../hooks/queries'
import { scrollToId } from '../../lib/sections'

/** Groups projects under their category, keeping category and project sort order. */
function groupProjects(categories, projects) {
  const groups = categories.map((c) => ({
    ...c,
    projects: projects.filter((p) => p.category_id === c.id),
  }))
  const loose = projects.filter((p) => !categories.some((c) => c.id === p.category_id))
  if (loose.length)
    groups.push({ id: 'other', title: 'Other work', description: '', projects: loose })
  return groups.filter((g) => g.projects.length)
}

function ProjectIndex({ groups }) {
  let n = 0
  return (
    <nav aria-label="Project index" className="border-line mb-8 rounded-2xl border p-5 md:p-8">
      <p className="text-muted mb-4 font-mono text-[11px] tracking-[0.2em] uppercase">Index</p>
      <ol className="grid gap-x-10 sm:grid-cols-2">
        {groups.flatMap((g) =>
          g.projects.map((p) => {
            n += 1
            return (
              <li key={p.id}>
                <a
                  href={`#project-${p.slug}`}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToId(`project-${p.slug}`)
                  }}
                  className="group border-line hover:text-accent flex min-h-12 items-baseline gap-4 border-b py-3 transition-colors"
                >
                  <span className="text-muted font-mono text-xs">{String(n).padStart(2, '0')}</span>
                  <span className="font-display text-lg">{p.title}</span>
                  <span className="text-muted ml-auto font-mono text-xs">{g.title}</span>
                </a>
              </li>
            )
          }),
        )}
      </ol>
    </nav>
  )
}

export default function Work() {
  const projectsQ = useProjects()
  const categoriesQ = categoryHooks.useList()
  const loading = projectsQ.isLoading || categoriesQ.isLoading
  const error = projectsQ.error || categoriesQ.error

  const groups = useMemo(
    () =>
      groupProjects(
        categoriesQ.data ?? [],
        (projectsQ.data ?? []).filter((p) => p.published),
      ),
    [categoriesQ.data, projectsQ.data],
  )

  let index = -1
  return (
    <section id="work" aria-labelledby="work-title" className="px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          index="01"
          label="Selected work"
          title="Things I've built"
          id="work-title"
        />
        {loading && (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="aspect-video w-full" />
          </div>
        )}
        {error && <ErrorNote what="projects" />}
        {!loading && !error && groups.length === 0 && (
          <p className="text-muted">No projects published yet.</p>
        )}
        {groups.length > 0 && <ProjectIndex groups={groups} />}
        {groups.map((g) => (
          <div key={g.id} className="pt-16">
            <Reveal className="mb-4 max-w-2xl">
              <h3 className="font-display text-2xl md:text-3xl">{g.title}</h3>
              {g.description && <p className="text-muted mt-2">{g.description}</p>}
            </Reveal>
            {g.projects.map((p) => {
              index += 1
              return <ProjectShowcase key={p.id} project={p} index={index} />
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
