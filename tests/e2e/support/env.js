import zlib from 'node:zlib'

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL
export const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY?.trim()
if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error(
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (in .env) before running tests.',
  )
}

export const OWNER_EMAIL = 'yunuszanzi@gmail.com'
export const AUTH_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`
export const FAKE_ID = '00000000-0000-4000-8000-000000000001'
export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
}

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')

/**
 * A session object shaped like Supabase's. The token is NOT valid for the real API (wrong
 * signature), which is fine: every write is faked by SupabaseMock, and reads strip it.
 */
export function fakeSession(email = OWNER_EMAIL) {
  const exp = Math.floor(Date.now() / 1000) + 3600
  return {
    access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'test-user', email, exp, role: 'authenticated' })}.sig`,
    refresh_token: 'test-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    user: { id: 'test-user', email, aud: 'authenticated', role: 'authenticated' },
  }
}

/** Solid-colour PNG of any size, built in memory (for upload tests). */
export function makePng(w, h) {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc = (buf) => {
    let c = 0xffffffff
    for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const c = Buffer.alloc(4)
    c.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, c])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  const raw = Buffer.alloc((w * 3 + 1) * h, 0x60)
  for (let y = 0; y < h; y++) raw[y * (w * 3 + 1)] = 0
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
