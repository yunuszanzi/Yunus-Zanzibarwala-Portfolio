// Checks Row Level Security using only the public key. Run: npm run verify:rls
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY?.trim()
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}
const sb = createClient(url, key, { auth: { persistSession: false } })
let failures = 0
const check = (name, ok, detail = '') => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`)
}

const readable = [
  'site_settings',
  'stats',
  'services',
  'project_categories',
  'projects',
  'project_images',
  'skill_groups',
  'experiences',
  'education',
  'also_shipped',
]
for (const t of readable) {
  const { data, error } = await sb.from(t).select('*')
  // project_images is legitimately empty until screenshots are uploaded from the admin.
  const ok = !error && (data.length > 0 || t === 'project_images')
  check(`anon can read ${t}`, ok, error?.message ?? `${data?.length} rows`)
}

const { data: projects } = await sb.from('projects').select('published')
check(
  'anon sees only published projects',
  projects?.length > 0 && projects.every((p) => p.published),
)

const { data: msgs } = await sb.from('messages').select('id')
check('anon cannot read messages', !msgs || msgs.length === 0)

const writes = {
  site_settings: { site_name: 'x' },
  stats: { value: 'x', label: 'x' },
  services: { title: 'x' },
  project_categories: { title: 'x' },
  projects: { title: 'x', slug: 'x-rls-test' },
  skill_groups: { name: 'x' },
  experiences: { role: 'x', company: 'x' },
  education: { degree: 'x', institution: 'x' },
  also_shipped: { title: 'x' },
}
for (const [t, row] of Object.entries(writes)) {
  const { error } = await sb.from(t).insert(row)
  check(`anon cannot insert into ${t}`, Boolean(error))
}
for (const t of readable) {
  // Harmless update (only touches updated_at) so a broken policy can't damage content.
  const { data } = await sb
    .from(t)
    .update({ updated_at: new Date().toISOString() })
    .not('id', 'is', null)
    .select()
  check(`anon cannot update ${t}`, !data?.length)
}

const { error: shortMsg } = await sb
  .from('messages')
  .insert({ name: 'x', email: 'a@b.co', message: 'short' })
check('message shorter than 10 chars is rejected', Boolean(shortMsg))
const { error: badEmail } = await sb
  .from('messages')
  .insert({ name: 'x', email: 'nope', message: 'long enough message' })
check('message with invalid email is rejected', Boolean(badEmail))
const { error: preRead } = await sb
  .from('messages')
  .insert({ name: 'x', email: 'a@b.co', message: 'long enough message', is_read: true })
check('message cannot be inserted as already read', Boolean(preRead))

const { error: up } = await sb.storage.from('portfolio').upload('rls-test.txt', new Blob(['x']))
check('anon cannot upload to storage', Boolean(up))

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
