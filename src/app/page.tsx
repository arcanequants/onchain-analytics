'use client';

/**
 * AI Perception Engineering Agency - Landing Page
 *
 * Phase 1, Week 1, Day 6
 * Main entry point for the application
 * Users enter a URL and get their AI Perception Score
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthModal from '@/components/AuthModal';
import {
  AnalysisLoadingScreen,
  Spinner,
} from '@/components/ui/LoadingStates';
import { useAnalysisProgress } from '@/components/ui/LoadingStates';

// ================================================================
// TYPES
// ================================================================

type AnalysisState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'starting' }
  | { status: 'analyzing'; analysisId: string }
  | { status: 'error'; message: string }
  | { status: 'complete'; resultUrl: string };

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: 'idle' });

  // SSE progress tracking
  const analysisId = analysisState.status === 'analyzing' ? analysisState.analysisId : null;
  const progress = useAnalysisProgress(analysisId);

  // Handle redirect when analysis completes
  if (progress.isComplete && progress.resultUrl) {
    router.push(progress.resultUrl);
  }

  // Handle progress error
  if (progress.error && analysisState.status === 'analyzing') {
    setAnalysisState({ status: 'error', message: progress.error });
  }

  const handleAnalyze = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    // Validate URL format
    setAnalysisState({ status: 'validating' });

    try {
      // Ensure URL has protocol
      let normalizedUrl = trimmedUrl;
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      // Validate URL format
      new URL(normalizedUrl);

      setAnalysisState({ status: 'starting' });

      // Call the analysis API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          options: {
            providers: ['openai', 'anthropic'],
            queryBudget: 20,
            includeCompetitors: true,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAnalysisState({
          status: 'error',
          message: data.error || 'Failed to start analysis',
        });
        return;
      }

      // Start tracking progress
      setAnalysisState({
        status: 'analyzing',
        analysisId: data.analysisId,
      });
    } catch (error) {
      setAnalysisState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Invalid URL format',
      });
    }
  }, [url]);

  const handleCancel = useCallback(() => {
    setAnalysisState({ status: 'idle' });
  }, []);

  const handleRetry = useCallback(() => {
    setAnalysisState({ status: 'idle' });
  }, []);

  // Show loading screen during analysis
  if (analysisState.status === 'analyzing') {
    return (
      <AnalysisLoadingScreen
        currentStage={progress.currentStage}
        percentComplete={progress.percentComplete}
        message={progress.message}
        onCancel={handleCancel}
      />
    );
  }

  const isProcessing = analysisState.status === 'validating' || analysisState.status === 'starting';

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
            <div className={`url-input-container ${analysisState.status === 'error' ? 'error' : ''}`}>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (analysisState.status === 'error') {
                    setAnalysisState({ status: 'idle' });
                  }
                }}
                placeholder="Enter your website URL..."
                className="url-input"
                disabled={isProcessing}
                aria-label="Website URL"
                aria-describedby={analysisState.status === 'error' ? 'error-message' : undefined}
              />
              <button
                type="submit"
                className="analyze-button"
                disabled={isProcessing || !url.trim()}
              >
                {isProcessing ? (
                  <>
                    <Spinner size="sm" className="button-spinner" />
                    <span>Starting...</span>
                  </>
                ) : (
                  'Analyze FREE'
                )}
              </button>
            </div>

            {analysisState.status === 'error' && (
              <p id="error-message" className="error-message" role="alert">
                {analysisState.message}
                <button type="button" onClick={handleRetry} className="retry-link">
                  Try again
                </button>
              </p>
            )}
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
            <p>We query ChatGPT & Claude about your industry with 20+ targeted questions</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Get Your Score</h3>
            <p>See your AI Visibility Score (0-100) and actionable recommendations</p>
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

      {/* What You Get Section */}
      <section className="features-section">
        <h2 className="section-title">What You&apos;ll Get</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h3>AI Visibility Score</h3>
            <p>A 0-100 score showing how visible your brand is across AI assistants</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3>Category Breakdown</h3>
            <p>Detailed scores for visibility, sentiment, authority, and more</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <h3>Action Plan</h3>
            <p>Prioritized recommendations to improve your AI perception</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h3>Industry Benchmarks</h3>
            <p>See how you compare to others in your industry</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to discover your AI perception?</h2>
        <p className="cta-subtitle">Join 1,000+ businesses already optimizing for AI visibility</p>
        <button
          onClick={() => document.querySelector<HTMLInputElement>('.url-input')?.focus()}
          className="cta-button"
        >
          Get Your Free Analysis
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">AI Perception</span>
            <p className="footer-tagline">Optimize your brand for the AI era</p>
          </div>
          <div className="footer-links">
            <Link href="/glossary">Glossary</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} AI Perception Engineering Agency
          </p>
        </div>
      </footer>

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

        .url-input-container.error {
          border-color: var(--error);
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

        .url-input:disabled {
          opacity: 0.7;
        }

        .analyze-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
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
          min-width: 140px;
        }

        .analyze-button:hover:not(:disabled) {
          background: var(--accent-secondary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--accent-glow);
        }

        .analyze-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .error-message {
          margin-top: 12px;
          color: var(--error);
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .retry-link {
          background: none;
          border: none;
          color: var(--accent-primary);
          cursor: pointer;
          text-decoration: underline;
          font-size: 14px;
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

        /* Features Section */
        .features-section {
          padding: 80px 20px;
          background: var(--bg-secondary);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          transition: all 0.3s;
        }

        .feature-card:hover {
          border-color: var(--accent-primary);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: var(--accent-primary);
        }

        .feature-icon svg {
          width: 100%;
          height: 100%;
        }

        .feature-card h3 {
          font-size: 1.1rem;
          margin-bottom: 8px;
        }

        .feature-card p {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        /* CTA Section */
        .cta-section {
          padding: 80px 20px;
          text-align: center;
          background: linear-gradient(180deg, var(--bg-primary), var(--bg-secondary));
        }

        .cta-section h2 {
          font-size: 2rem;
          margin-bottom: 16px;
        }

        .cta-subtitle {
          color: var(--text-secondary);
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

        /* Footer */
        .footer {
          padding: 48px 20px;
          border-top: 1px solid var(--border-primary);
          background: var(--bg-secondary);
        }

        .footer-content {
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
        }

        .footer-brand {
          margin-bottom: 24px;
        }

        .footer-logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .footer-tagline {
          color: var(--text-tertiary);
          font-size: 14px;
          margin-top: 8px;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-bottom: 24px;
        }

        .footer-links :global(a) {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-links :global(a:hover) {
          color: var(--accent-primary);
        }

        .footer-copyright {
          color: var(--text-tertiary);
          font-size: 12px;
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
          .features-section,
          .cta-section {
            padding: 60px 16px;
          }

          .footer-links {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
