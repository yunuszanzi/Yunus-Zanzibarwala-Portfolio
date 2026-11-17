import { linesToArray, projectSchema } from '../../../lib/schemas'

const FIELDS = Object.keys(projectSchema.shape)

export const EMPTY_PROJECT = {
  title: '',
  slug: '',
  category_id: '',
  year: '',
  description: '',
  role: '',
  tech: [],
  live_url: '',
  repo_label: '',
  repo_url: '',
  is_private: false,
  feature_groups: [],
  featured: false,
  published: false,
  sort_order: 0,
}

/** Database row -> form values. */
export function toFormValues(project) {
  if (!project) return EMPTY_PROJECT
  const values = Object.fromEntries(FIELDS.map((k) => [k, project[k] ?? EMPTY_PROJECT[k]]))
  values.feature_groups = (project.feature_groups ?? []).map((g) => ({
    heading: g.heading ?? '',
    bullets_text: (g.bullets ?? []).join('\n'),
  }))
  return values
}

/** Form values -> database row. */
export function toRow(values) {
  return {
    ...values,
    category_id: values.category_id || null,
    live_url: values.live_url || null,
    repo_url: values.repo_url || null,
    repo_label: values.repo_label || null,
    feature_groups: values.feature_groups.map((g) => ({
      heading: g.heading,
      bullets: linesToArray(g.bullets_text),
    })),
  }
}
