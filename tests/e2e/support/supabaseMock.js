// Intercepts every request to Supabase made by the browser.
//  - Reads (GET) go to the REAL database with the public key only (auth header stripped),
//    so they return exactly what an anonymous visitor would see.
//  - Every write (POST/PATCH/DELETE), upload and storage delete is FAKED and recorded in
//    `writes`, so tests can assert what would have been sent without touching live data.
import { CORS, FAKE_ID } from './env.js'

const json = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return text ?? null
  }
}

export class SupabaseMock {
  constructor(context) {
    this.context = context
    this.writes = []
    this.messages = null // set to an array to fake the (owner-only) inbox
    this.overrides = []
    this.created = {} // table -> last created row, served back for GET id=eq.FAKE_ID
  }

  async install() {
    await this.context.route(/supabase\.co/, async (route) => {
      try {
        await this.handle(route)
      } catch (err) {
        // A read still in flight when the test finishes isn't a failure.
        if (!/Test ended|disposed|closed|Target page/i.test(err.message)) throw err
      }
    })
    await this.context.route('https://mock.images/**', (route) => {
      const i = Number(
        route
          .request()
          .url()
          .match(/(\d+)\.svg/)?.[1] ?? 0,
      )
      const colors = ['#2b4c7e', '#7e2b4c', '#2b7e5a', '#7e6a2b']
      route.fulfill({
        contentType: 'image/svg+xml',
        body: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="100%" height="100%" fill="${colors[i % 4]}"/><text x="50%" y="50%" font-size="120" fill="#fff" text-anchor="middle">Screen ${i + 1}</text></svg>`,
      })
    })
  }

  /** Register a custom handler: match(req) -> boolean, handle(route, req). Checked first. */
  override(match, handle) {
    this.overrides.unshift({ match, handle })
  }

  /** Add fake screenshots (served from mock.images) to the first published project. */
  withImages(count = 3) {
    this.override(
      (req) => req.method() === 'GET' && /\/rest\/v1\/projects\?/.test(req.url()),
      async (route) => {
        const res = await route.fetch({ headers: this.anonHeaders(route.request()) })
        const data = await res.json()
        const list = Array.isArray(data) ? data : [data]
        const p = list[0]
        if (p) {
          p.project_images = Array.from({ length: count }, (_, i) => ({
            id: `00000000-0000-4000-8000-00000000010${i}`,
            project_id: p.id,
            image_url: `https://mock.images/${i}.svg`,
            storage_path: `projects/${p.id}/mock-${i}.webp`,
            caption: `Screen ${i + 1}`,
            step_label: ['Sign in', 'Dashboard', 'Settings', 'Done'][i] ?? `Step ${i + 1}`,
            sort_order: i + 1,
          }))
        }
        return route.fulfill({ response: res, json: data })
      },
    )
  }

  anonHeaders(req) {
    const headers = { ...req.headers() }
    delete headers.authorization
    return headers
  }

  async handle(route) {
    const req = route.request()
    const url = req.url()
    const method = req.method()
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    for (const o of this.overrides) if (o.match(req)) return o.handle(route, req)

    if (url.includes('/auth/v1/logout'))
      return route.fulfill({ status: 204, headers: CORS, body: '' })

    if (url.includes('/storage/v1/object')) {
      this.writes.push({
        kind: 'storage',
        method,
        url,
        contentType: req.headers()['content-type'],
        body: method === 'DELETE' ? json(req.postData()) : undefined,
      })
      return route.fulfill({ headers: CORS, json: method === 'DELETE' ? [] : { Key: 'mock' } })
    }

    const table = url.match(/\/rest\/v1\/(\w+)/)?.[1]
    if (method === 'GET' || method === 'HEAD') {
      if (table === 'messages' && this.messages) {
        return route.fulfill({ headers: CORS, json: this.messages })
      }
      if (url.includes(`id=eq.${FAKE_ID}`) && this.created[table]) {
        return route.fulfill({
          headers: CORS,
          json: { project_images: [], ...this.created[table] },
        })
      }
      return route.fulfill({ response: await route.fetch({ headers: this.anonHeaders(req) }) })
    }

    const body = json(req.postData())
    this.writes.push({ kind: 'rest', method, table, url, body })
    const row = Array.isArray(body) ? body[0] : body
    const result = { id: FAKE_ID, created_at: new Date().toISOString(), ...row }
    if (method === 'POST') this.created[table] = result
    return route.fulfill({
      status: method === 'POST' ? 201 : 200,
      headers: CORS,
      json: method === 'DELETE' ? [] : result,
    })
  }

  /** Recorded REST writes for a table, optionally filtered by HTTP method. */
  rest(table, method) {
    return this.writes.filter(
      (w) => w.kind === 'rest' && w.table === table && (!method || w.method === method),
    )
  }

  storage(method) {
    return this.writes.filter((w) => w.kind === 'storage' && (!method || w.method === method))
  }
}
