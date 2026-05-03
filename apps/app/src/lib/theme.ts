import { createContext, useContext, useEffect, useState, type ReactNode, createElement } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('theme') as Theme | null
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
    } catch (_) {}
    return 'system'
  })

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? getSystemTheme() : theme

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  function setTheme(next: Theme) {
    setThemeState(next)
    try {
      localStorage.setItem('theme', next)
    } catch (_) {}
  }

  return createElement(ThemeContext.Provider, { value: { theme, resolvedTheme, setTheme } }, children)
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
