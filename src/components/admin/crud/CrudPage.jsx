import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../PageHeader'
import SortableList from '../SortableList'
import CrudForm from './CrudForm'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import ConfirmDialog from '../../ui/ConfirmDialog'
import Skeleton from '../../ui/Skeleton'
import ErrorNote from '../../ui/ErrorNote'
import { useToast } from '../../../hooks/useToast'
import { errorMessage } from '../../../lib/utils'

const BLANK_BY_TYPE = { chips: [], switch: false }

/** Blank form values from the field config. */
function emptyValues(fields) {
  return {
    sort_order: 0,
    ...Object.fromEntries(fields.map((f) => [f.name, BLANK_BY_TYPE[f.type] ?? ''])),
  }
}

/**
 * List + create/edit dialog + delete + drag reorder for one simple table.
 * @param {{ config: import('../../../lib/adminModules').MODULES[string] }} props
 */
export default function CrudPage({ config }) {
  const { title, description, noun, hooks, schema, fields, summary, deleteNote } = config
  const toForm = config.toForm ?? ((r) => r)
  const toRow = config.toRow ?? ((v) => v)
  const getLabel = config.getLabel ?? ((r) => r.title ?? r.label ?? noun)

  const { data: rows, isLoading, error } = hooks.useList()
  const create = hooks.useCreate()
  const update = hooks.useUpdate()
  const remove = hooks.useRemove()
  const reorder = hooks.useReorder()
  const toast = useToast()
  const [editing, setEditing] = useState(null) // row, or {} for new
  const [toDelete, setToDelete] = useState(null)

  const isNew = editing && !editing.id
  const blank = emptyValues(fields)
  const pickForm = (row) => {
    const v = toForm(row)
    return Object.fromEntries(Object.keys(blank).map((k) => [k, v[k] ?? blank[k]]))
  }

  const onSubmit = async (values) => {
    try {
      const row = toRow(values)
      if (isNew) {
        row.sort_order = (rows ?? []).reduce((m, r) => Math.max(m, r.sort_order), 0) + 1
        await create.mutateAsync(row)
      } else {
        await update.mutateAsync({ id: editing.id, ...row, sort_order: editing.sort_order })
      }
      toast(isNew ? `Added ${noun}` : 'Saved')
      setEditing(null)
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  const onReorder = (next) =>
    reorder.mutate(next, {
      onSuccess: () => toast('Order saved'),
      onError: (e) => toast(errorMessage(e), 'error'),
    })

  const onDelete = async () => {
    try {
      await remove.mutateAsync(toDelete.id)
      toast(`Deleted ${noun}`)
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={() => setEditing({})}>
            <Plus size={16} aria-hidden="true" /> Add {noun}
          </Button>
        }
      />
      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}
      {error && <ErrorNote what={title.toLowerCase()} />}
      {rows?.length === 0 && (
        <div className="border-line text-muted rounded-xl border border-dashed p-10 text-center text-sm">
          Nothing here yet. Add your first {noun}.
        </div>
      )}
      {rows?.length > 0 && (
        <SortableList
          items={rows}
          onReorder={onReorder}
          getLabel={getLabel}
          className="space-y-2"
          itemClassName="border-line bg-surface rounded-xl border"
          renderItem={(row, handle) => {
            const [main, sub] = summary(row)
            return (
              <div className="flex items-center gap-1.5 p-2 sm:gap-3 sm:p-3">
                {handle}
                <button
                  type="button"
                  onClick={() => setEditing(row)}
                  className="hover:text-accent min-w-0 flex-1 py-1 text-left transition-colors"
                >
                  <span className="line-clamp-2 font-medium sm:line-clamp-1">{main}</span>
                  {sub && <span className="text-muted line-clamp-1 text-xs">{sub}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(row)}
                  aria-label={`Edit ${getLabel(row)}`}
                  className="text-muted hover:text-fg hover:bg-surface-2 hidden size-10 items-center justify-center rounded-lg sm:inline-flex"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(row)}
                  aria-label={`Delete ${getLabel(row)}`}
                  className="text-muted hover:bg-danger/10 hover:text-danger inline-flex size-10 shrink-0 items-center justify-center rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          }}
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={isNew ? `Add ${noun}` : `Edit ${noun}`}
      >
        {editing && (
          <CrudForm
            key={editing.id ?? 'new'}
            schema={schema}
            fields={fields}
            defaultValues={isNew ? blank : pickForm(editing)}
            onSubmit={onSubmit}
            onCancel={() => setEditing(null)}
            submitLabel={isNew ? `Add ${noun}` : 'Save'}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        title={`Delete this ${noun}?`}
        message={
          <>
            <strong className="text-fg">{toDelete && getLabel(toDelete)}</strong> will be removed
            from the site. {deleteNote}
          </>
        }
      />
    </div>
  )
}
