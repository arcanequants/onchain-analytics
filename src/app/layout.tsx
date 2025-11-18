import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import './typography-optionB.css'
import ClientLayout from '@/components/ClientLayout'
import AdScripts from '@/components/AdScripts'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'OnChain Analytics | Real-Time Crypto Data Oracle',
    description: 'The #1 oracle for on-chain metrics, gas prices, and crypto analytics. Real-time data for humans and AI agents.',
    keywords: 'crypto, blockchain, gas tracker, ethereum, polygon, arbitrum, optimism, base, on-chain analytics',
    other: {
      coinzilla: '8db58937faf87c02e615ea7fe53d1185',
    },
    metadataBase: new URL('https://vectorialdata.com'),
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Script
          id="coinzilla-meta"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var meta = document.createElement('meta');
                meta.name = 'coinzilla';
                meta.content = '8db58937faf87c02e615ea7fe53d1185';
                document.head.appendChild(meta);
              })();
            `,
          }}
        />
        <AdScripts />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
