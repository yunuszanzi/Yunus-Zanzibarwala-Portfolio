import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '../lib/db'

/**
 * Generic CRUD hooks for a simple Supabase table.
 * `order` is the column to sort by (default sort_order ascending).
 */
export function createTableHooks(table, { order = 'sort_order', ascending = true } = {}) {
  const key = [table]

  // Exposed so the build-time pre-renderer can fetch exactly what useList fetches.
  const listQuery = {
    queryKey: key,
    queryFn: async () => {
      const supabase = await db()
      const { data, error } = await supabase.from(table).select('*').order(order, { ascending })
      if (error) throw error
      return data
    },
  }

  function useList(options = {}) {
    return useQuery({ ...listQuery, ...options })
  }

  function useCreate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (values) => {
        const supabase = await db()
        const { data, error } = await supabase.from(table).insert(values).select().single()
        if (error) throw error
        return data
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    })
  }

  function useUpdate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async ({ id, ...values }) => {
        const supabase = await db()
        const { data, error } = await supabase
          .from(table)
          .update(values)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return data
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    })
  }

  /** Optimistic delete with rollback. */
  function useRemove() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (id) => {
        const supabase = await db()
        const { error } = await supabase.from(table).delete().eq('id', id)
        if (error) throw error
      },
      onMutate: async (id) => {
        await qc.cancelQueries({ queryKey: key })
        const previous = qc.getQueryData(key)
        qc.setQueryData(key, (rows) => rows?.filter((r) => r.id !== id))
        return { previous }
      },
      onError: (_e, _id, ctx) => qc.setQueryData(key, ctx?.previous),
      onSettled: () => qc.invalidateQueries({ queryKey: key }),
    })
  }

  /** Optimistic reorder. Pass the full list in its new order. */
  function useReorder() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (rows) => {
        const supabase = await db()
        const results = await Promise.all(
          rows.map((r, i) =>
            supabase
              .from(table)
              .update({ sort_order: i + 1 })
              .eq('id', r.id),
          ),
        )
        const failed = results.find((r) => r.error)
        if (failed) throw failed.error
      },
      onMutate: async (rows) => {
        await qc.cancelQueries({ queryKey: key })
        const previous = qc.getQueryData(key)
        qc.setQueryData(
          key,
          rows.map((r, i) => ({ ...r, sort_order: i + 1 })),
        )
        return { previous }
      },
      onError: (_e, _rows, ctx) => qc.setQueryData(key, ctx?.previous),
      onSettled: () => qc.invalidateQueries({ queryKey: key }),
    })
  }

  return { key, listQuery, useList, useCreate, useUpdate, useRemove, useReorder }
}
