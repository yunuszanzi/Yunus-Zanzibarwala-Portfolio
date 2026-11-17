/**
 * Loads the Supabase client on first use. The pre-rendered home page already has its data,
 * so the ~200 KB client stays out of the main bundle and arrives after the first paint.
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
export const db = () => import('./supabase').then((m) => m.supabase)
