'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement form submission (will add API endpoint later)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

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
            {'>'} CONTACT_US
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="cyber-text text-2xl font-bold mb-6">Send Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-cyber-cyan/80 mb-2">NAME</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-cyan/30 px-4 py-3 cyber-text focus:border-cyber-cyan focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-cyber-cyan/80 mb-2">EMAIL</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-cyan/30 px-4 py-3 cyber-text focus:border-cyber-cyan focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-cyber-cyan/80 mb-2">SUBJECT</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-black/50 border border-cyber-cyan/30 px-4 py-3 cyber-text focus:border-cyber-cyan focus:outline-none transition-colors"
                    required
                  >
                    <option value="">SELECT_TOPIC</option>
                    <option value="general">General Inquiry</option>
                    <option value="api">API Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership</option>
                    <option value="bug">Report Bug</option>
                    <option value="feature">Feature Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-cyber-cyan/80 mb-2">MESSAGE</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full bg-black/50 border border-cyber-cyan/30 px-4 py-3 cyber-text focus:border-cyber-cyan focus:outline-none transition-colors resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full cyber-border bg-black/50 hover:bg-cyber-cyan/10 py-3 cyber-text transition-all"
                >
                  {submitted ? 'MESSAGE_SENT ✓' : 'SEND_MESSAGE →'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="cyber-text text-2xl font-bold mb-6">Other Ways to Reach Us</h2>

              <div className="space-y-6">
                <div className="cyber-border bg-black/30 p-6">
                  <div className="text-cyber-green font-bold mb-2">EMAIL</div>
                  <a href="mailto:hello@onchainanalytics.io" className="text-cyber-cyan hover:text-cyber-green transition-colors">
                    hello@onchainanalytics.io
                  </a>
                </div>

                <div className="cyber-border bg-black/30 p-6">
                  <div className="text-cyber-green font-bold mb-2">SUPPORT</div>
                  <a href="mailto:support@onchainanalytics.io" className="text-cyber-cyan hover:text-cyber-green transition-colors">
                    support@onchainanalytics.io
                  </a>
                  <div className="text-cyber-cyan/60 text-sm mt-2">
                    Response time: {'<'} 2 hours
                  </div>
                </div>

                <div className="cyber-border bg-black/30 p-6">
                  <div className="text-cyber-green font-bold mb-2">PARTNERSHIPS</div>
                  <a href="mailto:partnerships@onchainanalytics.io" className="text-cyber-cyan hover:text-cyber-green transition-colors">
                    partnerships@onchainanalytics.io
                  </a>
                </div>

                <div className="cyber-border bg-black/30 p-6">
                  <div className="text-cyber-green font-bold mb-2">SOCIAL MEDIA</div>
                  <div className="space-y-2 mt-3">
                    <div>
                      <a href="https://twitter.com/onchainanalytics" className="text-cyber-cyan hover:text-cyber-green transition-colors">
                        → Twitter/X
                      </a>
                    </div>
                    <div>
                      <a href="https://discord.gg/onchainanalytics" className="text-cyber-cyan hover:text-cyber-green transition-colors">
                        → Discord
                      </a>
                    </div>
                    <div>
                      <a href="https://github.com/onchainanalytics" className="text-cyber-cyan hover:text-cyber-green transition-colors">
                        → GitHub
                      </a>
                    </div>
                    <div>
                      <a href="https://t.me/onchainanalytics" className="text-cyber-cyan hover:text-cyber-green transition-colors">
                        → Telegram
                      </a>
                    </div>
                  </div>
                </div>

                <div className="cyber-border bg-black/30 p-6">
                  <div className="text-cyber-green font-bold mb-2">OFFICE HOURS</div>
                  <div className="text-cyber-cyan/80 space-y-1">
                    <div>Monday - Friday: 9am - 6pm UTC</div>
                    <div>Saturday - Sunday: Closed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 pt-12 border-t border-cyber-cyan/30">
            <h2 className="cyber-text text-2xl font-bold mb-6">Quick Answers</h2>
            <div className="space-y-4">
              <details className="cyber-border bg-black/30 p-6">
                <summary className="cursor-pointer cyber-text font-bold">
                  How do I get API access?
                </summary>
                <p className="mt-4 text-cyber-cyan/80">
                  Visit our <Link href="/api" className="text-cyber-cyan hover:text-cyber-green">API documentation page</Link> to sign up for a free tier account.
                  Paid tiers available for higher rate limits.
                </p>
              </details>

              <details className="cyber-border bg-black/30 p-6">
                <summary className="cursor-pointer cyber-text font-bold">
                  Is the data real-time?
                </summary>
                <p className="mt-4 text-cyber-cyan/80">
                  Yes! Most metrics update every 10-30 seconds. Gas prices update every block (~12 seconds for Ethereum).
                </p>
              </details>

              <details className="cyber-border bg-black/30 p-6">
                <summary className="cursor-pointer cyber-text font-bold">
                  Can I use your data commercially?
                </summary>
                <p className="mt-4 text-cyber-cyan/80">
                  Yes, with a paid API subscription. See our <Link href="/pricing" className="text-cyber-cyan hover:text-cyber-green">pricing page</Link> for details.
                </p>
              </details>

              <details className="cyber-border bg-black/30 p-6">
                <summary className="cursor-pointer cyber-text font-bold">
                  Do you offer custom enterprise solutions?
                </summary>
                <p className="mt-4 text-cyber-cyan/80">
                  Yes! Contact us at partnerships@onchainanalytics.io for custom data feeds, white-label solutions, and dedicated infrastructure.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
