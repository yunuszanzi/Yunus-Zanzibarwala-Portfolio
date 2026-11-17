// Rule-based chat: matches a visitor's message against the predefined replies
// (chat_replies table, editable in /admin). No AI, no cost.

/** Lowercase, strip punctuation/accents, collapse spaces: "How much?!" -> "how much" */
export function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Best reply for a message, or null. Each keyword (word or phrase) found in the message
 * adds its length to the reply's score, so specific phrases beat single common words.
 * Clicking a suggested question matches its reply directly.
 * @param {{label:string, keywords:string[], answer:string}[]} replies in sort order
 */
export function findReply(replies, message) {
  const text = normalize(message)
  if (!text) return null
  const padded = ` ${text} `
  const words = new Set(text.split(' '))

  let best = null
  let bestScore = 0
  for (const reply of replies) {
    if (reply.label && normalize(reply.label) === text) return reply
    let score = 0
    for (const raw of reply.keywords ?? []) {
      const kw = normalize(raw)
      if (!kw) continue
      const hit = kw.includes(' ')
        ? padded.includes(` ${kw} `)
        : words.has(kw) || words.has(`${kw}s`) || (kw.endsWith('s') && words.has(kw.slice(0, -1)))
      if (hit) score += kw.length
    }
    // Strictly greater: on a tie the earlier reply (lower sort order) wins.
    if (score > bestScore) {
      best = reply
      bestScore = score
    }
  }
  return best
}

/** "+92 308-2352331" -> "923082352331" (wa.me wants digits only, with country code). */
export const phoneDigits = (phone = '') => phone.replace(/\D/g, '')

const MAX_WA_TEXT = 1800 // keep links well under browser/WhatsApp URL limits

/**
 * wa.me link that opens WhatsApp with the conversation pre-typed. If the chat is long,
 * the oldest messages are dropped so the link stays a safe length.
 */
export function whatsappLink(phone, messages) {
  const lines = messages.map((m) => `${m.from === 'user' ? 'Me' : 'Assistant'}: ${m.text}`)
  const header = 'Hi Yunus, I was chatting on your website:\n\n'
  let body = lines.join('\n')
  while (body.length > MAX_WA_TEXT && lines.length > 1) {
    lines.shift()
    body = `(earlier messages trimmed)\n${lines.join('\n')}`
  }
  return `https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(header + body)}`
}
