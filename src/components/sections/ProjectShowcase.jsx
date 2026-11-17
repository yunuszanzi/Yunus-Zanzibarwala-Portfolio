import { ArrowUpRight, Lock } from 'lucide-react'
import ChipList from '../ui/ChipList'
import Reveal from '../ui/Reveal'
import ProjectMedia from './ProjectMedia'

function ProjectLinks({ project }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      {project.live_url && (
        <a
          href={project.live_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-fg hover:text-accent inline-flex min-h-11 items-center gap-1 underline-offset-4 transition-colors hover:underline"
        >
          Visit live site <ArrowUpRight size={15} aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
      {project.repo_url && !project.is_private && (
        <a
          href={project.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-fg inline-flex min-h-11 items-center gap-1 transition-colors"
        >
          {project.repo_label || 'Source code'} <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      )}
      {project.is_private && (
        <span className="text-muted inline-flex items-center gap-1.5 font-mono text-xs">
          <Lock size={13} aria-hidden="true" /> {project.repo_label || 'Private repository'}
        </span>
      )}
    </div>
  )
}

/**
 * One large project block: meta, gallery, tech and feature groups.
 * @param {{ project: any, index: number, gallery?: import('react').ReactNode }} props
 */
export default function ProjectShowcase({ project, index, gallery }) {
  const images = project.project_images ?? []
  return (
    <article
      id={`project-${project.slug}`}
      aria-labelledby={`project-${project.slug}-title`}
      className="border-line scroll-mt-24 border-t py-16 md:py-24"
    >
      <Reveal className="mb-10 grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="text-muted mb-3 font-mono text-xs tracking-widest">
            <span className="text-accent">{String(index + 1).padStart(2, '0')}</span>
            {project.year && <> / {project.year}</>}
          </p>
          <h4
            id={`project-${project.slug}-title`}
            className="font-display text-3xl leading-tight tracking-tight md:text-5xl"
          >
            {project.title}
          </h4>
        </div>
        <div className="space-y-5 md:col-span-7 md:pt-8">
          <p className="text-muted text-lg leading-relaxed">{project.description}</p>
          <ProjectLinks project={project} />
        </div>
      </Reveal>

      {gallery ?? <ProjectMedia images={images} title={project.title} />}

      {(project.role || project.tech?.length > 0) && (
        <Reveal className="border-line mt-12 grid gap-6 border-t pt-8 md:grid-cols-12 md:gap-10">
          {project.role && (
            <div className="md:col-span-3">
              <h5 className="text-muted mb-2 font-mono text-[11px] tracking-[0.2em] uppercase">
                Role
              </h5>
              <p className="leading-relaxed">{project.role}</p>
            </div>
          )}
          {project.tech?.length > 0 && (
            <div className={project.role ? 'md:col-span-9' : 'md:col-span-12'}>
              <h5 className="text-muted mb-3 font-mono text-[11px] tracking-[0.2em] uppercase">
                Stack <span className="text-muted">· {project.tech.length}</span>
              </h5>
              <ChipList items={project.tech} label={`${project.title} tech stack`} />
            </div>
          )}
        </Reveal>
      )}

      {project.feature_groups?.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {project.feature_groups.map((g, i) => (
            <Reveal
              key={i}
              delay={i * 0.05}
              className="border-line bg-surface/60 rounded-2xl border p-5 md:p-6"
            >
              <h5 className="mb-3 font-medium">{g.heading}</h5>
              <ul className="text-muted space-y-2 text-sm leading-relaxed">
                {g.bullets?.map((b, j) => (
                  <li key={j} className="flex gap-3">
                    <span
                      className="bg-accent mt-2 size-1 shrink-0 rounded-full"
                      aria-hidden="true"
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      )}
    </article>
  )
}
