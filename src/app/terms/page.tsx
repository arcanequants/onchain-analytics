'use client'

import Link from 'next/link'

export default function TermsPage() {
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
            {'>'} TERMS_OF_SERVICE
          </h1>

          <div className="space-y-6 text-cyber-cyan/80">
            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using OnChain Analytics, you accept and agree to be bound by these Terms of Service.
                If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="mb-4">
                OnChain Analytics provides:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Real-time blockchain and cryptocurrency data</li>
                <li>Analytics dashboards and visualizations</li>
                <li>API access for developers and AI agents</li>
                <li>Educational content and market insights</li>
              </ul>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">3. User Responsibilities</h2>
              <p className="mb-4">
                You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use our services legally and ethically</li>
                <li>Not abuse, overload, or disrupt our infrastructure</li>
                <li>Not attempt to circumvent API rate limits</li>
                <li>Not scrape data without authorization</li>
                <li>Keep API keys secure and confidential</li>
              </ul>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">4. Data Accuracy Disclaimer</h2>
              <p>
                While we strive for accuracy, data is provided "AS IS" without warranties. OnChain Analytics
                is not responsible for trading decisions made based on our data. Always verify critical information
                from multiple sources.
              </p>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">5. API Usage Limits</h2>
              <p className="mb-4">
                API rate limits are as follows:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Free tier: 100 requests/day</li>
                <li>Hobby tier: 10,000 requests/day</li>
                <li>Pro tier: 100,000 requests/day</li>
                <li>Enterprise tier: 1,000,000 requests/day</li>
              </ul>
              <p className="mt-4">
                Exceeding limits may result in temporary suspension. Contact us for higher limits.
              </p>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">6. Intellectual Property</h2>
              <p>
                All content, designs, and code are © 2024 OnChain Analytics. API data may be used according to
                your subscription tier. Unauthorized redistribution is prohibited.
              </p>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">7. Termination</h2>
              <p>
                We reserve the right to terminate or suspend access for violations of these terms, abuse,
                or illegal activity.
              </p>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">8. Limitation of Liability</h2>
              <p>
                OnChain Analytics is not liable for any direct, indirect, incidental, or consequential damages
                resulting from the use or inability to use our services.
              </p>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">9. Changes to Terms</h2>
              <p>
                We may update these terms at any time. Continued use after changes constitutes acceptance
                of the new terms.
              </p>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">10. Contact</h2>
              <p>
                For questions about these terms, contact us at:{' '}
                <Link href="/contact" className="text-cyber-cyan hover:text-cyber-green transition-colors">
                  legal@onchainanalytics.io
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
