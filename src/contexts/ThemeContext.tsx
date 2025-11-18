'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'auto' | 'dark' | 'light'
export type ResolvedTheme = 'dark' | 'light'

interface ThemeContextType {
  mode: ThemeMode           // User's preference: auto, dark, or light
  resolvedTheme: ResolvedTheme  // Currently active theme: dark or light
  setMode: (mode: ThemeMode) => void
  cycleMode: () => void     // Cycle through auto → dark → light → auto
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Get resolved theme based on mode
const getResolvedTheme = (mode: ThemeMode): ResolvedTheme => {
  if (mode === 'auto') {
    const hour = new Date().getHours()
    // 6 AM (6) to 6 PM (18) = light mode
    // 6 PM (18) to 6 AM (6) = dark mode
    return (hour >= 6 && hour < 18) ? 'light' : 'dark'
  }
  return mode as ResolvedTheme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true)

    // Load mode from localStorage (migrate old 'theme' key to 'theme-mode')
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null
    const legacyTheme = localStorage.getItem('theme') as ResolvedTheme | null

    let initialMode: ThemeMode = 'auto'

    if (savedMode && ['auto', 'dark', 'light'].includes(savedMode)) {
      initialMode = savedMode
    } else if (legacyTheme && ['dark', 'light'].includes(legacyTheme)) {
      // Migrate from old theme system
      initialMode = legacyTheme
      localStorage.removeItem('theme')
      localStorage.setItem('theme-mode', legacyTheme)
    }

    setModeState(initialMode)
    const resolved = getResolvedTheme(initialMode)
    setResolvedTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
  }, [])

  // Auto-update theme every minute when in auto mode
  useEffect(() => {
    if (mode === 'auto') {
      const interval = setInterval(() => {
        const newResolvedTheme = getResolvedTheme('auto')
        if (newResolvedTheme !== resolvedTheme) {
          setResolvedTheme(newResolvedTheme)
          document.documentElement.setAttribute('data-theme', newResolvedTheme)
        }
      }, 60000) // Check every minute

      return () => clearInterval(interval)
    }
  }, [mode, resolvedTheme])

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem('theme-mode', newMode)

    const resolved = getResolvedTheme(newMode)
    setResolvedTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
  }

  const cycleMode = () => {
    const modes: ThemeMode[] = ['auto', 'dark', 'light']
    const currentIndex = modes.indexOf(mode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setMode(nextMode)
  }

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode, cycleMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Legacy compatibility export
export type Theme = ResolvedTheme
