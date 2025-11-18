import type { Metadata } from 'next'
import './globals.css'
import './typography-optionB.css'
import ClientLayout from '@/components/ClientLayout'
import AdScripts from '@/components/AdScripts'

export const metadata: Metadata = {
  title: 'OnChain Analytics | Real-Time Crypto Data Oracle',
  description: 'The #1 oracle for on-chain metrics, gas prices, and crypto analytics. Real-time data for humans and AI agents.',
  keywords: 'crypto, blockchain, gas tracker, ethereum, polygon, arbitrum, optimism, base, on-chain analytics',
  verification: {
    other: {
      'coinzilla': '8db58937faf87c02e615ea7fe53d1185',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AdScripts />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
