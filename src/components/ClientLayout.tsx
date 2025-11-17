'use client'

import { ThemeProvider } from '@/contexts/ThemeContext'
import ThemeToggle from '@/components/ThemeToggle'
import GoogleAnalytics from '@/components/GoogleAnalytics'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GoogleAnalytics />
      {children}
      <ThemeToggle />
    </ThemeProvider>
  )
}
