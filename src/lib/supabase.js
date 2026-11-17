import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const SUPABASE_URL = url
export const SUPABASE_KEY = key

export const isSupabaseConfigured = Boolean(url && key)

if (!isSupabaseConfigured) {
  console.warn('Supabase env vars are missing. Copy .env.example to .env and fill them in.')
}

// Only the public (anon/publishable) key is ever used in the browser.
export const supabase = createClient(url || 'http://localhost', key || 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const STORAGE_BUCKET = 'portfolio'
