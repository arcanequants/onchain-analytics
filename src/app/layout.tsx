import type { Metadata } from 'next'
import './globals.css'
import GoogleAnalytics from '@/components/GoogleAnalytics'

export const metadata: Metadata = {
  title: 'OnChain Analytics | Real-Time Crypto Data Oracle',
  description: 'The #1 oracle for on-chain metrics, gas prices, and crypto analytics. Real-time data for humans and AI agents.',
  keywords: 'crypto, blockchain, gas tracker, ethereum, polygon, arbitrum, optimism, base, on-chain analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  )
}
