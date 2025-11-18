'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type ResolvedTheme = 'dark' | 'light'

interface ThemeContextType {
  theme: ResolvedTheme          // Currently active theme: dark or light
  hasOverride: boolean           // Whether user manually chose a theme today
  setTheme: (theme: ResolvedTheme) => void  // Set manual theme override
  toggleTheme: () => void        // Toggle between dark and light
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Get auto theme based on time of day
const getAutoTheme = (): ResolvedTheme => {
  const hour = new Date().getHours()
  // 6 AM (6) to 6 PM (18) = light mode
  // 6 PM (18) to 6 AM (6) = dark mode
  return (hour >= 6 && hour < 18) ? 'light' : 'dark'
}

// Get today's date string for comparison
const getTodayString = (): string => {
  return new Date().toDateString()
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ResolvedTheme>('dark')
  const [hasOverride, setHasOverride] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true)

    const today = getTodayString()
    const savedDate = localStorage.getItem('theme-override-date')
    const override = localStorage.getItem('theme-override') as ResolvedTheme | null

    let initialTheme: ResolvedTheme

    // Check if there's a valid override for today
    if (savedDate === today && override && ['dark', 'light'].includes(override)) {
      // Same day, use override
      initialTheme = override
      setHasOverride(true)
    } else {
      // Different day or no override → use AUTO
      initialTheme = getAutoTheme()
      setHasOverride(false)

      // Clean up old override
      if (savedDate !== today) {
        localStorage.removeItem('theme-override')
        localStorage.removeItem('theme-override-date')
      }
    }

    setThemeState(initialTheme)
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [])

  // Auto-update theme every minute when no override
  useEffect(() => {
    if (!hasOverride) {
      const interval = setInterval(() => {
        const autoTheme = getAutoTheme()
        if (autoTheme !== theme) {
          setThemeState(autoTheme)
          document.documentElement.setAttribute('data-theme', autoTheme)
        }
      }, 60000) // Check every minute

      return () => clearInterval(interval)
    }
  }, [hasOverride, theme])

  const setTheme = (newTheme: ResolvedTheme) => {
    const today = getTodayString()

    // Save override for today
    localStorage.setItem('theme-override', newTheme)
    localStorage.setItem('theme-override-date', today)

    setThemeState(newTheme)
    setHasOverride(true)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, hasOverride, setTheme, toggleTheme }}>
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

// Legacy compatibility exports
export type Theme = ResolvedTheme
export type ThemeMode = ResolvedTheme
