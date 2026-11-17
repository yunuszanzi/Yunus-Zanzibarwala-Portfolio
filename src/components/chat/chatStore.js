// Keeps the visitor's conversation in localStorage so a refresh doesn't lose it.

const KEY = 'chat:v1'

function randomToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** A brand-new conversation: random id + secret token used by save_chat(). */
export function newConversation() {
  return { id: crypto.randomUUID(), token: randomToken(), messages: [] }
}

export function loadConversation() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.id && saved?.token && Array.isArray(saved.messages)) return saved
  } catch {
    /* storage unavailable or corrupt */
  }
  return newConversation()
}

export function storeConversation(conv) {
  try {
    localStorage.setItem(KEY, JSON.stringify(conv))
  } catch {
    /* storage unavailable: the chat still works, it just won't survive a refresh */
  }
}
