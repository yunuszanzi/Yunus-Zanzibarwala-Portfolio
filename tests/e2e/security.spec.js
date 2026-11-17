import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { ANON_KEY, SUPABASE_URL } from './support/env.js'

// These run in Node against the REAL Supabase project with the public key, exactly as an
// attacker could. Every attempt is expected to be refused, so nothing changes. Updates use a
// harmless value (updated_at) so even a broken policy couldn't damage content, and deletes
// are not attempted for the same reason (delete policies mirror the update ones).

const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })

const CONTENT = {
  site_settings: { site_name: 'x' },
  stats: { value: 'x', label: 'x' },
  services: { title: 'x' },
  project_categories: { title: 'x' },
  projects: { title: 'x', slug: 'rls-probe' },
  project_images: {
    project_id: '00000000-0000-4000-8000-000000000001',
    image_url: 'x',
    storage_path: 'x',
  },
  skill_groups: { name: 'x' },
  experiences: { role: 'x', company: 'x' },
  education: { degree: 'x', institution: 'x' },
  also_shipped: { title: 'x' },
}

for (const [table, row] of Object.entries(CONTENT)) {
  test(`anon cannot insert or update ${table}`, async () => {
    const { error: insertError } = await anon.from(table).insert(row)
    expect(insertError, 'insert should be refused').not.toBeNull()

    const { data: updated } = await anon
      .from(table)
      .update({ updated_at: new Date().toISOString() })
      .not('id', 'is', null)
      .select()
    expect(updated ?? []).toHaveLength(0)
  })
}

test('anon can read published content', async () => {
  for (const table of ['site_settings', 'projects', 'skill_groups', 'experiences']) {
    const { data, error } = await anon.from(table).select('id').limit(1)
    expect(error).toBeNull()
    expect(data.length).toBeGreaterThan(0)
  }
})

test('unpublished projects (and their images) are never returned to the public', async () => {
  const { data: projects, error } = await anon.from('projects').select('id, published')
  expect(error).toBeNull()
  expect(projects.every((p) => p.published)).toBe(true)
  const { data: drafts } = await anon.from('projects').select('id').eq('published', false)
  expect(drafts).toHaveLength(0)

  const ids = new Set(projects.map((p) => p.id))
  const { data: images } = await anon.from('project_images').select('project_id')
  expect(images.every((i) => ids.has(i.project_id))).toBe(true)
})

test('anon cannot read, change or delete messages', async () => {
  const { data } = await anon.from('messages').select('*')
  expect(data ?? []).toHaveLength(0)
  const { data: updated } = await anon
    .from('messages')
    .update({ is_read: true })
    .not('id', 'is', null)
    .select()
  expect(updated ?? []).toHaveLength(0)
})

test('invalid contact messages are refused by the database', async () => {
  const bad = [
    { name: 'x', email: 'a@b.co', message: 'short' },
    { name: 'x', email: 'not-an-email', message: 'Long enough message here.' },
    { name: 'x', email: 'a@b.co', message: 'Long enough message here.', is_read: true },
  ]
  for (const row of bad) {
    const { error } = await anon.from('messages').insert(row)
    expect(error, JSON.stringify(row)).not.toBeNull()
  }
})

test('anon cannot upload to or delete from storage', async () => {
  const { error } = await anon.storage
    .from('portfolio')
    .upload(`rls-probe-${Date.now()}.txt`, new Blob(['x']))
  expect(error).not.toBeNull()
})
