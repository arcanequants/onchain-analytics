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
      <head>
        {/* Theme initialization script - prevents flash of unstyled content */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const today = new Date().toDateString();
                  const savedDate = localStorage.getItem('theme-override-date');
                  const override = localStorage.getItem('theme-override');

                  let theme;

                  // Check if there's a valid override for today
                  if (savedDate === today && override && ['dark', 'light'].includes(override)) {
                    // Same day, use override
                    theme = override;
                  } else {
                    // Different day or no override → use AUTO (time-based)
                    const hour = new Date().getHours();
                    // 6 AM (6) to 6 PM (18) = light mode
                    // 6 PM (18) to 6 AM (6) = dark mode
                    theme = (hour >= 6 && hour < 18) ? 'light' : 'dark';

                    // Clean up old override
                    if (savedDate !== today) {
                      localStorage.removeItem('theme-override');
                      localStorage.removeItem('theme-override-date');
                    }
                  }

                  // Apply theme immediately
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  // Fallback to dark mode if anything fails
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
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
