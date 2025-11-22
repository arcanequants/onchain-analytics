'use client'

import { ThemeProvider } from '@/contexts/ThemeContext'
import ThemeToggle from '@/components/ThemeToggle'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GoogleAnalytics />
      {children}
      <Footer />
      <CookieBanner />
      <ThemeToggle />
    </ThemeProvider>
  )
}
