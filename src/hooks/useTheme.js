import { useContext } from 'react'
import { ThemeContext } from '../lib/themeContext'

/** Returns [theme, toggle]. Must be used inside <ThemeProvider>. */
export function useTheme() {
  const { theme, toggle } = useContext(ThemeContext)
  return [theme, toggle]
}
