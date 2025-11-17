'use client'

import Link from 'next/link'

export default function AboutPage() {
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
              <Link href="/contact" className="cyber-text hover:text-cyber-green transition-colors">
                CONTACT
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-20 relative z-10">
        <div className="cyber-border bg-black/50 p-12">
          <h1 className="cyber-text text-4xl font-bold mb-8">
            {'>'} ABOUT_US
          </h1>

          <div className="space-y-8 text-cyber-cyan/80">
            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg">
                Build the #1 global oracle for on-chain metrics, traditional finance data, and sports betting analytics.
                Serve humans, AI agents, and bots worldwide with verifiable, real-time financial intelligence.
              </p>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">What We Do</h2>
              <p className="mb-4">
                OnChain Analytics provides real-time data and analytics across multiple domains:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="cyber-border bg-black/30 p-6">
                  <div className="cyber-text text-xl font-bold mb-3">🔗 CRYPTO</div>
                  <ul className="space-y-2 text-sm">
                    <li>Gas price tracking</li>
                    <li>Fear & Greed Index</li>
                    <li>DEX volume analytics</li>
                    <li>On-chain metrics</li>
                  </ul>
                </div>
                <div className="cyber-border bg-black/30 p-6">
                  <div className="cyber-text text-xl font-bold mb-3">📈 TRADFI</div>
                  <ul className="space-y-2 text-sm">
                    <li>Stock market data</li>
                    <li>Forex tracking</li>
                    <li>Commodities prices</li>
                    <li>Market indices</li>
                  </ul>
                </div>
                <div className="cyber-border bg-black/30 p-6">
                  <div className="cyber-text text-xl font-bold mb-3">⚽ SPORTS</div>
                  <ul className="space-y-2 text-sm">
                    <li>Live sports stats</li>
                    <li>Betting odds</li>
                    <li>Game predictions</li>
                    <li>Historical data</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">Why We're Different</h2>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <div>
                    <strong className="text-cyber-cyan">API-First Architecture:</strong> Built specifically for AI agents
                    and automated systems, not just humans.
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <div>
                    <strong className="text-cyber-cyan">Multi-Asset Coverage:</strong> Crypto, TradFi, and Sports - all in
                    one place.
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <div>
                    <strong className="text-cyber-cyan">Real-Time Data:</strong> Sub-second updates for critical metrics.
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <div>
                    <strong className="text-cyber-cyan">Open & Transparent:</strong> All data sources cited, methodology documented.
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-cyber-green text-xl">✓</span>
                  <div>
                    <strong className="text-cyber-cyan">Developer-Friendly:</strong> Perfect documentation, OpenAPI specs,
                    code examples in 10+ languages.
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">Our Technology</h2>
              <p className="mb-4">
                Built with modern, scalable infrastructure:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Next.js', 'TypeScript', 'Supabase', 'Vercel', 'Alchemy', 'TailwindCSS', 'PostgreSQL', 'REST API'].map((tech) => (
                  <div key={tech} className="cyber-border bg-black/30 p-4 text-center">
                    {tech}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">Our Principles</h2>
              <div className="space-y-3">
                <div className="cyber-border bg-black/30 p-4">
                  <strong className="text-cyber-cyan">1. Accuracy First:</strong> One wrong number = trust lost forever.
                </div>
                <div className="cyber-border bg-black/30 p-4">
                  <strong className="text-cyber-cyan">2. Speed Matters:</strong> Page load {'<'} 2 seconds, API response {'<'} 100ms.
                </div>
                <div className="cyber-border bg-black/30 p-4">
                  <strong className="text-cyber-cyan">3. User Privacy:</strong> Minimal data collection, no dark patterns.
                </div>
                <div className="cyber-border bg-black/30 p-4">
                  <strong className="text-cyber-cyan">4. Open Communication:</strong> Status page, public roadmap, responsive support.
                </div>
              </div>
            </section>

            <section>
              <h2 className="cyber-text text-2xl font-bold mb-4">The Team</h2>
              <p>
                Built by a small team of engineers and data scientists passionate about decentralization,
                transparency, and building tools that actually work.
              </p>
              <p className="mt-4">
                We're bootstrapped, independent, and focused on building the best data oracle in the world.
              </p>
            </section>

            <section className="pt-8 border-t border-cyber-cyan/30">
              <h2 className="cyber-text text-2xl font-bold mb-4">Get in Touch</h2>
              <p>
                Questions? Feedback? Want to partner?{' '}
                <Link href="/contact" className="text-cyber-cyan hover:text-cyber-green transition-colors">
                  Contact us →
                </Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
