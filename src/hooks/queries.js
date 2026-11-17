import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '../lib/db'
import { createTableHooks } from './useTable'

export const stats = createTableHooks('stats')
export const services = createTableHooks('services')
export const categories = createTableHooks('project_categories')
export const skillGroups = createTableHooks('skill_groups')
export const experiences = createTableHooks('experiences')
export const education = createTableHooks('education')
export const alsoShipped = createTableHooks('also_shipped')
export const messages = createTableHooks('messages', { order: 'created_at', ascending: false })

// ---------------------------------------------------------------- site settings (single row)
const settingsQuery = {
  queryKey: ['site_settings'],
  queryFn: async () => {
    const supabase = await db()
    const { data, error } = await supabase.from('site_settings').select('*').maybeSingle()
    if (error) throw error
    return data
  },
}

export function useSettings() {
  return useQuery(settingsQuery)
}

export function useSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const supabase = await db()
      const query = id
        ? supabase.from('site_settings').update(values).eq('id', id)
        : supabase.from('site_settings').insert(values)
      const { data, error } = await query.select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => qc.setQueryData(['site_settings'], data),
  })
}

// ---------------------------------------------------------------- projects
const PROJECTS_KEY = ['projects']

function sortImages(project) {
  return {
    ...project,
    project_images: [...(project.project_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }
}

const projectsQuery = {
  queryKey: PROJECTS_KEY,
  queryFn: async () => {
    const supabase = await db()
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_images(*)')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data.map(sortImages)
  },
}

/** Projects with their images. RLS hides drafts from anonymous visitors automatically. */
export function useProjects() {
  return useQuery(projectsQuery)
}

/** Every query the public home page runs. Used by the build-time pre-renderer. */
export const PUBLIC_QUERIES = [
  settingsQuery,
  projectsQuery,
  categories.listQuery,
  stats.listQuery,
  services.listQuery,
  skillGroups.listQuery,
  experiences.listQuery,
  education.listQuery,
  alsoShipped.listQuery,
]

export function useProject(id) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const supabase = await db()
      const { data, error } = await supabase
        .from('projects')
        .select('*, project_images(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return sortImages(data)
    },
  })
}

export function useSaveProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const supabase = await db()
      // Only normalise category_id when it's part of the update, so partial updates
      // (e.g. just toggling `published`) don't clear the category.
      const payload =
        'category_id' in values ? { ...values, category_id: values.category_id || null } : values
      const query = id
        ? supabase.from('projects').update(payload).eq('id', id)
        : supabase.from('projects').insert(payload)
      const { data, error } = await query.select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

/** Deletes the project row and its files in Storage (image rows cascade in the database). */
export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (project) => {
      const supabase = await db()
      const paths = [
        ...(project.project_images ?? []).map((i) => i.storage_path),
        project.cover_image_path,
      ].filter(Boolean)
      const { error } = await supabase.from('projects').delete().eq('id', project.id)
      if (error) throw error
      if (paths.length) await supabase.storage.from('portfolio').remove(paths)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

export function useReorderProjects() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows) => {
      const supabase = await db()
      const results = await Promise.all(
        rows.map((r, i) =>
          supabase
            .from('projects')
            .update({ sort_order: i + 1 })
            .eq('id', r.id),
        ),
      )
      const failed = results.find((r) => r.error)
      if (failed) throw failed.error
    },
    onMutate: async (rows) => {
      await qc.cancelQueries({ queryKey: PROJECTS_KEY })
      const previous = qc.getQueryData(PROJECTS_KEY)
      qc.setQueryData(PROJECTS_KEY, rows)
      return { previous }
    },
    onError: (_e, _rows, ctx) => qc.setQueryData(PROJECTS_KEY, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

// ---------------------------------------------------------------- project images
export function useSaveProjectImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const supabase = await db()
      const query = id
        ? supabase.from('project_images').update(values).eq('id', id)
        : supabase.from('project_images').insert(values)
      const { data, error } = await query.select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

export function useDeleteProjectImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (image) => {
      const supabase = await db()
      const { error } = await supabase.from('project_images').delete().eq('id', image.id)
      if (error) throw error
      if (image.storage_path) await supabase.storage.from('portfolio').remove([image.storage_path])
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

export function useReorderProjectImages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows) => {
      const supabase = await db()
      const results = await Promise.all(
        rows.map((r, i) =>
          supabase
            .from('project_images')
            .update({ sort_order: i + 1 })
            .eq('id', r.id),
        ),
      )
      const failed = results.find((r) => r.error)
      if (failed) throw failed.error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
  })
}

// ---------------------------------------------------------------- contact form (public insert)
export function useSendMessage() {
  return useMutation({
    mutationFn: async ({ website, ...values }) => {
      const supabase = await db()
      // Honeypot: bots fill the hidden field. Pretend success, store nothing.
      if (website) return { skipped: true }
      const { error } = await supabase.from('messages').insert(values)
      if (error) throw error
      return { skipped: false }
    },
  })
}
