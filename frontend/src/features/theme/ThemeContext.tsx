import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'codeguardian_theme'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
      if (saved === 'dark' || saved === 'light') {
        return saved
      }
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
    } catch {
      // Fallback
    }
    return 'dark'
  })

  // Apply theme to DOM
  const applyThemeToDOM = useCallback((t: Theme) => {
    const root = document.documentElement
    const body = document.body

    // Add a temporary transition class for smooth theme switching
    root.classList.add('theme-transition')

    if (t === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
      if (body) {
        body.classList.add('dark')
        body.classList.remove('light')
      }
      root.setAttribute('data-theme', 'dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
      if (body) {
        body.classList.add('light')
        body.classList.remove('dark')
      }
      root.setAttribute('data-theme', 'light')
      root.style.colorScheme = 'light'
    }

    // Remove transition class after animation completes
    const timer = setTimeout(() => {
      root.classList.remove('theme-transition')
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    applyThemeToDOM(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
      window.dispatchEvent(new CustomEvent('codeguardian_theme_changed', { detail: { theme } }))
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [theme, applyThemeToDOM])

  // Listen to system preference changes if user hasn't explicitly set one yet
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(STORAGE_KEY)
      // Only auto-switch if user hasn't explicitly set their preference
      if (!saved) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [])

  // Listen for storage changes across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue as Theme)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
