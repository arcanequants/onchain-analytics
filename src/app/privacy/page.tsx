'use client'

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen relative">
      {/* Header */}
      <header className="border-b border-cyber-cyan/50 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="cyber-text text-2xl font-bold">
              [ ONCHAIN ANALYTICS ]
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/" className="cyber-text hover:text-cyber-green transition-colors">
                HOME
              </Link>
              <Link href="/about" className="cyber-text hover:text-cyber-green transition-colors">
                ABOUT
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-20 relative z-10">
        <div className="cyber-border bg-black/50 p-12">
          <h1 className="cyber-text text-4xl font-bold mb-8">
            {'>'} PRIVACY_POLICY
          </h1>

          <div className="space-y-6 text-cyber-cyan/80">
            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                We collect minimal information to provide our services. This includes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Analytics data (page views, traffic sources, device types)</li>
                <li>API usage data (endpoint calls, response times)</li>
                <li>No personal identifiable information is collected without consent</li>
              </ul>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">2. How We Use Data</h2>
              <p className="mb-4">
                We use collected data to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Improve our services and user experience</li>
                <li>Monitor API performance and uptime</li>
                <li>Display relevant advertisements (via Coinzilla and Google AdSense)</li>
                <li>Generate anonymous analytics and statistics</li>
              </ul>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">3. Cookies</h2>
              <p>
                We use cookies for analytics and ad personalization. You can disable cookies in your browser settings,
                but this may affect site functionality.
              </p>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">4. Third-Party Services</h2>
              <p className="mb-4">
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Google Analytics (traffic analytics)</li>
                <li>Coinzilla (cryptocurrency advertisements)</li>
                <li>Google AdSense (general advertisements)</li>
                <li>Vercel (hosting and deployment)</li>
                <li>Supabase (database services)</li>
              </ul>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. All data transmission
                is encrypted via HTTPS.
              </p>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">6. Your Rights</h2>
              <p className="mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Request deletion of your data</li>
                <li>Opt-out of analytics tracking</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">7. Contact</h2>
              <p>
                For privacy-related questions, contact us at:{' '}
                <Link href="/contact" className="text-cyber-cyan hover:text-cyber-green transition-colors">
                  privacy@onchainanalytics.io
                </Link>
              </p>
            </section>

            <section className="pt-8 border-t border-cyber-cyan/30">
              <p className="text-cyber-cyan/60">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
