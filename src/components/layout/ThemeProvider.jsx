import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from '../../lib/themeContext'

function getInitial() {
  if (typeof document === 'undefined') return 'dark' // server render
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

/** Holds the current theme. The inline script in index.html sets it before first paint. */
export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
