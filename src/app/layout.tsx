import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

/**
 * AI Perception Engineering Agency
 *
 * Discover how AI models perceive and recommend your brand
 * SaaS tool for GEO (Generative Engine Optimization)
 */

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'AI Perception | How Do AI Models See Your Brand?',
    description: 'Discover how ChatGPT, Claude, Gemini and Perplexity perceive your brand. Get your AI Perception Score and actionable recommendations to improve your visibility in AI recommendations.',
    keywords: 'AI perception, GEO, generative engine optimization, ChatGPT recommendations, Claude recommendations, AI visibility, brand perception, AI marketing',
    metadataBase: new URL('https://vectorialdata.com'),
    openGraph: {
      title: 'AI Perception | How Do AI Models See Your Brand?',
      description: 'Discover how ChatGPT, Claude, Gemini and Perplexity perceive your brand.',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AI Perception | How Do AI Models See Your Brand?',
      description: 'Get your AI Perception Score today.',
    },
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
                    theme = override;
                  } else {
                    const hour = new Date().getHours();
                    theme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
                    if (savedDate !== today) {
                      localStorage.removeItem('theme-override');
                      localStorage.removeItem('theme-override-date');
                    }
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
