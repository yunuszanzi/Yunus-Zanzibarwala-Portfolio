import { supabase } from './supabase'

// Insert order respects foreign keys (categories before projects before images).
// Messages are private inbox data and stay out of backups.
const TABLES = [
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

/** Fetch every content table into one JSON-able object. */
export async function exportContent() {
  const tables = {}
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select('*')
    if (error) throw error
    tables[t] = data
  }
  return { version: 1, exported_at: new Date().toISOString(), tables }
}

export function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** Basic shape check so a random JSON file can't wipe the site. */
export function validateBackup(obj) {
  if (!obj || obj.version !== 1 || typeof obj.tables !== 'object') {
    throw new Error('This doesn’t look like a backup file from this site.')
  }
  for (const t of TABLES) {
    if (!Array.isArray(obj.tables[t])) throw new Error(`Backup is missing the "${t}" table.`)
  }
  return obj
}

/**
 * Replace all content with the backup. Deletes children first, inserts parents first.
 * Not atomic: if it fails halfway, import the same file again.
 */
export async function importContent(backup) {
  validateBackup(backup)
  for (const t of [...TABLES].reverse()) {
    const { error } = await supabase.from(t).delete().not('id', 'is', null)
    if (error) throw error
  }
  for (const t of TABLES) {
    const rows = backup.tables[t]
    if (!rows.length) continue
    const { error } = await supabase.from(t).insert(rows)
    if (error) throw new Error(`Import failed on "${t}": ${error.message}`)
  }
}
