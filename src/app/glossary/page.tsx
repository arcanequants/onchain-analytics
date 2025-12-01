'use client';

/**
 * Glossary Page - Core AI Perception Terms
 *
 * Phase 1, Week 1, Day 5
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.31 & UX-WRITING-GUIDE.md
 *
 * Explains the 6 core terms users need to understand:
 * 1. AI Perception Score
 * 2. GEO (Generative Engine Optimization)
 * 3. Share of Voice (SOV)
 * 4. E-E-A-T
 * 5. Hallucination
 * 6. Knowledge Graph
 */

import Link from 'next/link';
import { useState } from 'react';

// ================================================================
// GLOSSARY DATA
// ================================================================

interface GlossaryTerm {
  id: string;
  term: string;
  shortDefinition: string;
  fullDefinition: string;
  examples?: string[];
  relatedTerms?: string[];
  icon: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'ai-perception-score',
    term: 'AI Perception Score',
    shortDefinition: 'A 0-100 measurement of how likely AI models are to recommend your brand.',
    fullDefinition: `The AI Perception Score measures how likely AI assistants like ChatGPT and Claude are to recommend your brand when users ask about your industry. A higher score means more visibility and recommendations from AI models.

The score is calculated by analyzing:
- How often AI mentions your brand when asked about your industry
- The sentiment (positive, neutral, or negative) of those mentions
- Whether AI recommends you specifically or just mentions you
- Your brand's authority signals that AI models recognize`,
    examples: [
      'A score of 85 means AI recommends you in most relevant queries',
      'A score of 45 means you appear sometimes but competitors dominate',
      'A score of 15 means AI rarely mentions you for your industry',
    ],
    relatedTerms: ['GEO', 'Share of Voice', 'E-E-A-T'],
    icon: '🎯',
  },
  {
    id: 'geo',
    term: 'GEO (Generative Engine Optimization)',
    shortDefinition: 'Like SEO, but for AI assistants instead of search engines.',
    fullDefinition: `Generative Engine Optimization (GEO) is the practice of optimizing your brand's presence for AI models. Just like SEO helps you rank higher in Google, GEO helps AI assistants like ChatGPT recommend you more often.

GEO involves:
- Ensuring your brand information is accurate across the web
- Building authority signals that AI models recognize
- Creating content that AI can understand and cite
- Getting listed in knowledge bases AI models trust (like Wikipedia and Wikidata)`,
    examples: [
      'Adding Schema.org markup so AI understands your business type',
      'Getting cited in reputable publications that AI models reference',
      'Ensuring your Wikipedia article (if you have one) is accurate',
    ],
    relatedTerms: ['AI Perception Score', 'Knowledge Graph', 'E-E-A-T'],
    icon: '🚀',
  },
  {
    id: 'share-of-voice',
    term: 'Share of Voice (SOV)',
    shortDefinition: 'The percentage of times AI mentions you vs. competitors.',
    fullDefinition: `Share of Voice measures what percentage of AI conversations about your industry include mentions of your brand compared to your competitors.

For example, if we ask ChatGPT 10 questions about "best CRM software" and your brand is mentioned in 3 of those responses, your Share of Voice is 30%.

A higher Share of Voice means:
- More visibility when users ask AI for recommendations
- Greater mindshare in AI-generated content
- More potential customers discovering your brand through AI`,
    examples: [
      'If Salesforce is mentioned in 6/10 CRM queries and you in 2/10, Salesforce has 60% SOV and you have 20%',
      'Improving from 15% to 35% SOV can significantly increase AI-driven leads',
    ],
    relatedTerms: ['AI Perception Score', 'GEO'],
    icon: '📊',
  },
  {
    id: 'eeat',
    term: 'E-E-A-T',
    shortDefinition: 'Experience, Expertise, Authoritativeness, Trust - signals AI uses to evaluate brands.',
    fullDefinition: `E-E-A-T stands for Experience, Expertise, Authoritativeness, and Trust. Originally Google's quality framework, AI models also use these signals to determine which brands to recommend.

The four components:
- **Experience**: First-hand experience with the topic
- **Expertise**: Deep knowledge in a specific field
- **Authoritativeness**: Recognition from others in the industry
- **Trust**: Reliability and accuracy of information

AI models learn E-E-A-T signals from:
- Customer reviews and testimonials
- Industry awards and certifications
- Press coverage and expert mentions
- Quality of your content and website`,
    examples: [
      'A doctor writing about medicine shows expertise',
      'Being cited by industry publications shows authoritativeness',
      'Consistent, accurate business information shows trust',
    ],
    relatedTerms: ['AI Perception Score', 'GEO', 'Knowledge Graph'],
    icon: '✅',
  },
  {
    id: 'hallucination',
    term: 'Hallucination',
    shortDefinition: 'When AI states incorrect information about your brand.',
    fullDefinition: `A hallucination occurs when an AI model confidently states something incorrect about your brand. This could be wrong products, incorrect locations, outdated pricing, or completely fabricated information.

Common hallucination examples:
- AI says you're based in New York when you're in Los Angeles
- AI describes products you don't actually offer
- AI mentions partnerships that don't exist
- AI gives outdated information (old pricing, discontinued products)

Hallucinations matter because:
- Users trust AI responses and may believe false information
- Incorrect information can damage your reputation
- It can lead to lost sales or confused customers

Preventing hallucinations:
- Ensure accurate information across all web sources
- Get listed in trusted databases like Wikidata
- Keep your website and business listings up to date`,
    examples: [
      'ChatGPT says your restaurant is vegan-only when it serves meat dishes',
      'Claude lists a product feature you removed two years ago',
    ],
    relatedTerms: ['Knowledge Graph', 'E-E-A-T'],
    icon: '⚠️',
  },
  {
    id: 'knowledge-graph',
    term: 'Knowledge Graph',
    shortDefinition: 'Trusted databases like Wikidata that AI models rely on.',
    fullDefinition: `A Knowledge Graph is a structured database of facts that AI models use as trusted sources of information. The most important knowledge graphs include:

- **Wikidata**: The structured data behind Wikipedia
- **Google Knowledge Graph**: Powers Google's knowledge panels
- **DBpedia**: Academic database of structured information

Why Knowledge Graphs matter for AI perception:
- AI models prioritize information from these trusted sources
- Being in a Knowledge Graph reduces hallucinations about your brand
- It establishes your brand as a recognized entity
- Information in Knowledge Graphs gets cited accurately

Getting into Knowledge Graphs:
- Create or improve your Wikipedia article
- Add your company to Wikidata with accurate information
- Ensure consistency across all official sources
- Use Schema.org markup on your website`,
    examples: [
      'A Wikidata entry with your founding date, location, and industry',
      'Being in Google Knowledge Graph shows a knowledge panel for your brand',
    ],
    relatedTerms: ['Hallucination', 'GEO', 'E-E-A-T'],
    icon: '🔗',
  },
];

// ================================================================
// COMPONENTS
// ================================================================

function TermCard({
  term,
  isExpanded,
  onToggle,
}: {
  term: GlossaryTerm;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      id={term.id}
      className={`term-card ${isExpanded ? 'expanded' : ''}`}
    >
      <button
        className="term-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`term-content-${term.id}`}
      >
        <div className="term-header-left">
          <span className="term-icon" aria-hidden="true">
            {term.icon}
          </span>
          <div>
            <h2 className="term-title">{term.term}</h2>
            <p className="term-short">{term.shortDefinition}</p>
          </div>
        </div>
        <span className={`expand-icon ${isExpanded ? 'rotated' : ''}`} aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      <div
        id={`term-content-${term.id}`}
        className="term-content"
        role="region"
        aria-labelledby={term.id}
        hidden={!isExpanded}
      >
        <div className="term-full-definition">
          {term.fullDefinition.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {term.examples && term.examples.length > 0 && (
          <div className="term-examples">
            <h3>Examples</h3>
            <ul>
              {term.examples.map((example, idx) => (
                <li key={idx}>{example}</li>
              ))}
            </ul>
          </div>
        )}

        {term.relatedTerms && term.relatedTerms.length > 0 && (
          <div className="term-related">
            <h3>Related terms</h3>
            <div className="related-links">
              {term.relatedTerms.map((related) => {
                const relatedTerm = GLOSSARY_TERMS.find(
                  (t) =>
                    t.term.toLowerCase().includes(related.toLowerCase()) ||
                    related.toLowerCase().includes(t.term.toLowerCase().split(' ')[0])
                );
                if (relatedTerm) {
                  return (
                    <a
                      key={related}
                      href={`#${relatedTerm.id}`}
                      className="related-link"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(relatedTerm.id)?.scrollIntoView({
                          behavior: 'smooth',
                        });
                      }}
                    >
                      {related}
                    </a>
                  );
                }
                return (
                  <span key={related} className="related-tag">
                    {related}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .term-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .term-card:hover {
          border-color: var(--border-secondary);
        }

        .term-card.expanded {
          border-color: var(--accent-primary);
        }

        .term-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          gap: 16px;
        }

        .term-header:hover {
          background: var(--bg-hover);
        }

        .term-header-left {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .term-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .term-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .term-short {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .expand-icon {
          color: var(--text-tertiary);
          transition: transform 0.3s;
          flex-shrink: 0;
        }

        .expand-icon.rotated {
          transform: rotate(180deg);
        }

        .term-content {
          padding: 0 24px 24px;
          border-top: 1px solid var(--border-primary);
        }

        .term-content[hidden] {
          display: none;
        }

        .term-full-definition {
          padding-top: 20px;
        }

        .term-full-definition p {
          color: var(--text-primary);
          line-height: 1.8;
          margin-bottom: 16px;
        }

        .term-full-definition p:last-child {
          margin-bottom: 0;
        }

        .term-examples,
        .term-related {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px dashed var(--border-primary);
        }

        .term-examples h3,
        .term-related h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 12px 0;
        }

        .term-examples ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .term-examples li {
          color: var(--text-secondary);
          padding: 8px 0;
          padding-left: 24px;
          position: relative;
        }

        .term-examples li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--accent-primary);
        }

        .related-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .related-link,
        .related-tag {
          display: inline-block;
          padding: 6px 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 6px;
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.2s;
        }

        .related-link:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        @media (max-width: 768px) {
          .term-header {
            padding: 16px;
          }

          .term-header-left {
            flex-direction: column;
            gap: 12px;
          }

          .term-content {
            padding: 0 16px 16px;
          }
        }
      `}</style>
    </article>
  );
}

// ================================================================
// MAIN PAGE
// ================================================================

export default function GlossaryPage() {
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  const toggleTerm = (termId: string) => {
    setExpandedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(termId)) {
        next.delete(termId);
      } else {
        next.add(termId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTerms(new Set(GLOSSARY_TERMS.map((t) => t.id)));
  };

  const collapseAll = () => {
    setExpandedTerms(new Set());
  };

  return (
    <div className="glossary-page">
      {/* Header */}
      <header className="glossary-header">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="separator">/</span>
          <span className="current">Glossary</span>
        </nav>

        <h1 className="page-title">AI Perception Glossary</h1>
        <p className="page-description">
          Learn the key terms and concepts behind AI visibility and brand perception.
          Understanding these terms will help you improve how AI models recommend your brand.
        </p>

        <div className="header-actions">
          <button onClick={expandAll} className="action-button">
            Expand all
          </button>
          <button onClick={collapseAll} className="action-button">
            Collapse all
          </button>
        </div>
      </header>

      {/* Terms List */}
      <main className="terms-list">
        {GLOSSARY_TERMS.map((term) => (
          <TermCard
            key={term.id}
            term={term}
            isExpanded={expandedTerms.has(term.id)}
            onToggle={() => toggleTerm(term.id)}
          />
        ))}
      </main>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to improve your AI perception?</h2>
        <p>Get your AI Perception Score and actionable recommendations in 30 seconds.</p>
        <Link href="/" className="cta-button">
          Analyze your brand
        </Link>
      </section>

      {/* Footer */}
      <footer className="glossary-footer">
        <p>
          Need help understanding your results?{' '}
          <Link href="/contact">Contact our team</Link>
        </p>
      </footer>

      <style jsx>{`
        .glossary-page {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          padding: 40px 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .glossary-header {
          margin-bottom: 48px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .breadcrumb :global(a) {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.2s;
        }

        .breadcrumb :global(a:hover) {
          color: var(--accent-primary);
        }

        .separator {
          color: var(--text-tertiary);
        }

        .current {
          color: var(--text-secondary);
        }

        .page-title {
          font-size: clamp(2rem, 5vw, 2.5rem);
          font-weight: 800;
          margin: 0 0 16px 0;
        }

        .page-description {
          font-size: 1.1rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0 0 24px 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .action-button {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          padding: 8px 16px;
          font-size: 14px;
          color: var(--text-secondary);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .terms-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cta-section {
          margin-top: 64px;
          padding: 48px 32px;
          background: var(--bg-secondary);
          border-radius: 16px;
          text-align: center;
        }

        .cta-section h2 {
          font-size: 1.5rem;
          margin: 0 0 12px 0;
        }

        .cta-section p {
          color: var(--text-secondary);
          margin: 0 0 24px 0;
        }

        .cta-button {
          display: inline-block;
          background: var(--accent-primary);
          color: white;
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.3s;
        }

        .cta-button:hover {
          background: var(--accent-secondary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--accent-glow);
        }

        .glossary-footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid var(--border-primary);
          text-align: center;
        }

        .glossary-footer p {
          color: var(--text-tertiary);
          font-size: 14px;
        }

        .glossary-footer :global(a) {
          color: var(--accent-primary);
          text-decoration: none;
        }

        .glossary-footer :global(a:hover) {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .glossary-page {
            padding: 24px 16px;
          }

          .cta-section {
            padding: 32px 20px;
          }
        }
      `}</style>
    </div>
  );
}
