import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageIcon, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import PageHeader from '../../components/admin/PageHeader'
import SortableList from '../../components/admin/SortableList'
import { Switch } from '../../components/admin/FormFields'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Skeleton from '../../components/ui/Skeleton'
import ErrorNote from '../../components/ui/ErrorNote'
import {
  categories as categoryHooks,
  useDeleteProject,
  useProjects,
  useReorderProjects,
  useSaveProject,
} from '../../hooks/queries'
import { useToast } from '../../hooks/useToast'
import { cn, errorMessage } from '../../lib/utils'

function Thumb({ project }) {
  const src = project.cover_image_url || project.project_images?.[0]?.image_url
  return (
    <div className="border-line bg-surface-2 text-muted hidden size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border sm:flex">
      {src ? (
        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <ImageIcon size={18} aria-hidden="true" />
      )}
    </div>
  )
}

export default function ProjectsList() {
  const { data: projects, isLoading, error } = useProjects()
  const { data: cats } = categoryHooks.useList()
  const reorder = useReorderProjects()
  const save = useSaveProject()
  const remove = useDeleteProject()
  const toast = useToast()
  const [toDelete, setToDelete] = useState(null)

  const catName = (id) => cats?.find((c) => c.id === id)?.title ?? 'No category'

  const onReorder = (rows) =>
    reorder.mutate(rows, {
      onSuccess: () => toast('Order saved'),
      onError: (e) => toast(errorMessage(e), 'error'),
    })

  const togglePublished = async (p) => {
    try {
      await save.mutateAsync({ id: p.id, published: !p.published })
      toast(p.published ? `“${p.title}” is now a draft` : `“${p.title}” is published`)
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  const onDelete = async () => {
    try {
      await remove.mutateAsync(toDelete)
      toast(`Deleted “${toDelete.title}”`)
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description="Drag to reorder. Drafts only show up here, never on the public site."
        actions={
          <Button to="/admin/projects/new">
            <Plus size={16} aria-hidden="true" /> New project
          </Button>
        }
      />
      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}
      {error && <ErrorNote what="projects" />}
      {projects?.length === 0 && (
        <div className="border-line text-muted rounded-xl border border-dashed p-10 text-center text-sm">
          No projects yet. Add your first one.
        </div>
      )}
      {projects?.length > 0 && (
        <SortableList
          items={projects}
          onReorder={onReorder}
          className="space-y-2"
          itemClassName="border-line bg-surface rounded-xl border"
          renderItem={(p, handle) => (
            <div className="flex items-center gap-1.5 p-2 sm:gap-3 sm:p-3 sm:pr-4">
              {handle}
              <Thumb project={p} />
              <div className="min-w-0 flex-1">
                <Link
                  to={`/admin/projects/${p.id}`}
                  className="hover:text-accent line-clamp-2 font-medium transition-colors sm:line-clamp-1"
                >
                  {p.title}
                </Link>
                <p className="text-muted truncate text-xs">
                  {catName(p.category_id)}
                  {p.year && ` · ${p.year}`} · {p.project_images?.length ?? 0} screenshots
                </p>
              </div>
              {p.featured && (
                <Star
                  size={15}
                  className="text-accent hidden shrink-0 sm:block"
                  aria-label="Featured"
                />
              )}
              <span
                className={cn(
                  'hidden rounded-full px-2.5 py-1 font-mono text-[11px] md:inline',
                  p.published ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-muted',
                )}
              >
                {p.published ? 'Published' : 'Draft'}
              </span>
              <Switch
                id={`pub-${p.id}`}
                checked={p.published}
                onChange={() => togglePublished(p)}
                label={<span className="sr-only">Published: {p.title}</span>}
              />
              <Link
                to={`/admin/projects/${p.id}`}
                aria-label={`Edit ${p.title}`}
                className="text-muted hover:text-fg hover:bg-surface-2 hidden size-10 items-center justify-center rounded-lg sm:inline-flex"
              >
                <Pencil size={16} />
              </Link>
              <button
                type="button"
                onClick={() => setToDelete(p)}
                aria-label={`Delete ${p.title}`}
                className="text-muted hover:bg-danger/10 hover:text-danger inline-flex size-10 items-center justify-center rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        />
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        title={`Delete “${toDelete?.title}”?`}
        message="The project and all its screenshots are deleted, including the image files in storage. This can’t be undone."
      />
    </>
  )
}
