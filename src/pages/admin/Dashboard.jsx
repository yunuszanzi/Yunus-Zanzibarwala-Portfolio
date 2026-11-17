import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageHeader from '../../components/admin/PageHeader'
import Skeleton from '../../components/ui/Skeleton'
import { ADMIN_NAV } from '../../lib/adminNav'
import {
  alsoShipped,
  categories,
  education,
  experiences,
  messages,
  services,
  skillGroups,
  stats,
  useProjects,
} from '../../hooks/queries'

function useCounts() {
  const q = {
    projects: useProjects(),
    categories: categories.useList(),
    stats: stats.useList(),
    services: services.useList(),
    skills: skillGroups.useList(),
    experience: experiences.useList(),
    education: education.useList(),
    'also-shipped': alsoShipped.useList(),
    messages: messages.useList(),
  }
  const loading = Object.values(q).some((x) => x.isLoading)
  const counts = Object.fromEntries(Object.entries(q).map(([k, v]) => [k, v.data?.length ?? 0]))
  const drafts = q.projects.data?.filter((p) => !p.published).length ?? 0
  const unread = q.messages.data?.filter((m) => !m.is_read).length ?? 0
  return { loading, counts, drafts, unread }
}

export default function Dashboard() {
  const { loading, counts, drafts, unread } = useCounts()
  const cards = ADMIN_NAV.filter((n) => n.path && n.path !== 'settings')

  return (
    <>
      <PageHeader title="Dashboard" description="Everything on the public site, in one place." />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          ['Published projects', counts.projects - drafts],
          ['Drafts', drafts],
          ['Unread messages', unread],
        ].map(([label, value]) => (
          <div key={label} className="border-line bg-surface rounded-xl border p-5">
            <p className="text-muted text-sm">{label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-9 w-12" />
            ) : (
              <p className="font-display mt-1 text-4xl">{value}</p>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-muted mb-4 font-mono text-[11px] tracking-[0.2em] uppercase">Content</h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <li>
          <Link
            to="/admin/settings"
            className="border-line bg-surface hover:border-muted group flex items-center gap-4 rounded-xl border p-5 transition-colors"
          >
            <span className="flex-1">
              <span className="block font-medium">Site settings</span>
              <span className="text-muted text-sm">Hero, about, contact, SEO</span>
            </span>
            <ArrowRight size={16} className="text-muted group-hover:text-fg" aria-hidden="true" />
          </Link>
        </li>
        {cards.map(({ path, label, icon: Icon }) => (
          <li key={path}>
            <Link
              to={`/admin/${path}`}
              className="border-line bg-surface hover:border-muted group flex items-center gap-4 rounded-xl border p-5 transition-colors"
            >
              <Icon size={18} className="text-muted" aria-hidden="true" />
              <span className="flex-1 font-medium">{label}</span>
              <span className="text-muted font-mono text-sm">{loading ? '–' : counts[path]}</span>
              <ArrowRight size={16} className="text-muted group-hover:text-fg" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
