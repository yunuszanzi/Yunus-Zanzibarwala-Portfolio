import { useCallback, useEffect, useRef, useState } from 'react'

/** Copy text to the clipboard. `copied` is true for ~2s after a successful copy. */
export function useCopy() {
  const [copied, setCopied] = useState(false)
  const timer = useRef()

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
      return true
    } catch {
      return false
    }
  }, [])

  return { copied, copy }
}
