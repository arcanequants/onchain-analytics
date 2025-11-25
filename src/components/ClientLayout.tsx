'use client'

/**
 * Client Layout Component
 *
 * Provides theme context and common UI elements for the app
 * Updated for AI Perception Engineering Agency
 */

import { ThemeProvider } from '@/contexts/ThemeContext'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'
import './ClientLayout.css'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="app-layout">
        {children}
        <Footer />
      </div>
      <CookieBanner />
    </ThemeProvider>
  )
}
