'use client'

/**
 * AI Perception Engineering Agency - Landing Page
 *
 * Main entry point for the application
 * Users enter a URL and get their AI Perception Score
 *
 * Phase 1 MVP - Placeholder landing page
 */

import { useState } from 'react'
import Link from 'next/link'
import AuthModal from '@/components/AuthModal'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    // For MVP: Show auth modal to capture user
    setShowAuth(true)

    // TODO: Implement analysis flow in Phase 2
    // setIsAnalyzing(true)
    // const result = await analyzeUrl(url)
    // router.push(`/results/${result.id}`)
  }

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            How Do AI Models
            <span className="hero-highlight"> See Your Brand?</span>
          </h1>

          <p className="hero-subtitle">
            Discover if ChatGPT, Claude, Gemini and Perplexity recommend your
            business. Get your AI Perception Score and actionable insights.
          </p>

          {/* URL Input Form */}
          <form onSubmit={handleAnalyze} className="url-form">
            <div className="url-input-container">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter your website URL..."
                className="url-input"
                required
              />
              <button
                type="submit"
                className="analyze-button"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze FREE'}
              </button>
            </div>
          </form>

          <p className="hero-note">
            No credit card required. Results in 30 seconds.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Enter Your URL</h3>
            <p>Just paste your website, product page, or business URL</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>We Ask the AIs</h3>
            <p>We query ChatGPT, Claude, Gemini & Perplexity about your industry</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Get Your Score</h3>
            <p>See your AI Perception Score (0-100) and detailed insights</p>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="problem-section">
        <div className="problem-content">
          <h2 className="section-title">The Problem</h2>
          <p className="problem-text">
            When someone asks ChatGPT &quot;What&apos;s the best {'{your industry}'} in {'{your city}'}&quot;,
            <strong> do they recommend you?</strong>
          </p>
          <p className="problem-text">
            Most businesses have <strong>no idea</strong> if AI models recommend them or not.
            And if they don&apos;t, they&apos;re losing customers without knowing it.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to discover your AI perception?</h2>
        <button
          onClick={() => setShowAuth(true)}
          className="cta-button"
        >
          Get Your Free Analysis
        </button>
      </section>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          defaultMode="signup"
        />
      )}

      <style jsx>{`
        .landing-container {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        /* Hero Section */
        .hero {
          padding: 80px 20px;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .hero-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.2;
          margin: 0;
        }

        .hero-highlight {
          color: var(--accent-primary);
          display: block;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: var(--text-secondary);
          max-width: 600px;
          line-height: 1.6;
          margin: 0;
        }

        /* URL Form */
        .url-form {
          width: 100%;
          max-width: 600px;
          margin-top: 20px;
        }

        .url-input-container {
          display: flex;
          gap: 8px;
          background: var(--bg-secondary);
          border: 2px solid var(--border-primary);
          border-radius: 12px;
          padding: 8px;
          transition: border-color 0.3s;
        }

        .url-input-container:focus-within {
          border-color: var(--accent-primary);
        }

        .url-input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 12px 16px;
          font-size: 16px;
          color: var(--text-primary);
          outline: none;
        }

        .url-input::placeholder {
          color: var(--text-tertiary);
        }

        .analyze-button {
          background: var(--accent-primary);
          color: white;
          border: none;
          padding: 12px 28px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .analyze-button:hover:not(:disabled) {
          background: var(--accent-secondary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--accent-glow);
        }

        .analyze-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .hero-note {
          font-size: 14px;
          color: var(--text-tertiary);
          margin: 0;
        }

        /* How It Works */
        .how-it-works {
          padding: 80px 20px;
          background: var(--bg-secondary);
        }

        .section-title {
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 48px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .step-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          transition: all 0.3s;
        }

        .step-card:hover {
          border-color: var(--accent-primary);
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: var(--accent-primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          margin: 0 auto 16px;
        }

        .step-card h3 {
          font-size: 1.25rem;
          margin-bottom: 12px;
        }

        .step-card p {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        /* Problem Section */
        .problem-section {
          padding: 80px 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .problem-text {
          font-size: 1.25rem;
          line-height: 1.8;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        .problem-text strong {
          color: var(--text-primary);
        }

        /* CTA Section */
        .cta-section {
          padding: 80px 20px;
          text-align: center;
          background: linear-gradient(180deg, var(--bg-secondary), var(--bg-primary));
        }

        .cta-section h2 {
          font-size: 2rem;
          margin-bottom: 32px;
        }

        .cta-button {
          background: var(--accent-primary);
          color: white;
          border: none;
          padding: 16px 48px;
          font-size: 18px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cta-button:hover {
          background: var(--accent-secondary);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--accent-glow);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .hero {
            padding: 40px 16px;
          }

          .url-input-container {
            flex-direction: column;
          }

          .analyze-button {
            width: 100%;
          }

          .how-it-works,
          .problem-section,
          .cta-section {
            padding: 60px 16px;
          }
        }
      `}</style>
    </div>
  )
}
