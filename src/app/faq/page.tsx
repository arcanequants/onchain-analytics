/**
 * FAQ Page with Schema.org Markup
 *
 * Phase 2, Week 3, Day 5
 * SEO-optimized FAQ page with JSON-LD structured data
 */

import { Metadata } from 'next';
import Link from 'next/link';

// ================================================================
// METADATA
// ================================================================

export const metadata: Metadata = {
  title: 'FAQ - AI Perception Engineering | Common Questions',
  description:
    'Frequently asked questions about AI perception, brand visibility in AI systems, and how to optimize your digital presence for AI-powered search.',
  keywords: [
    'AI perception FAQ',
    'brand AI visibility',
    'AI search optimization',
    'LLM brand mentions',
    'AI brand monitoring',
  ],
  openGraph: {
    title: 'FAQ - AI Perception Engineering',
    description: 'Common questions about AI perception and brand visibility in AI systems.',
    type: 'website',
  },
};

// ================================================================
// FAQ DATA
// ================================================================

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'technical' | 'pricing' | 'results';
}

const faqItems: FAQItem[] = [
  // General
  {
    category: 'general',
    question: 'What is AI Perception Engineering?',
    answer:
      'AI Perception Engineering is the practice of optimizing how brands and entities are understood and represented by AI systems like ChatGPT, Claude, Google Gemini, and Perplexity. It focuses on ensuring accurate, positive, and comprehensive representation in AI-generated responses.',
  },
  {
    category: 'general',
    question: 'Why does AI perception matter for my brand?',
    answer:
      'As more users rely on AI assistants for information and recommendations, how AI systems perceive and describe your brand directly impacts discovery, reputation, and customer decisions. Poor or inaccurate AI perception can lead to missed opportunities and reputation damage.',
  },
  {
    category: 'general',
    question: 'Which AI systems do you analyze?',
    answer:
      'We analyze responses from leading AI systems including OpenAI GPT-4, Anthropic Claude, Google Gemini, and Perplexity AI. Our analysis covers how each system perceives your brand across various query types and contexts.',
  },
  {
    category: 'general',
    question: 'How is this different from traditional SEO?',
    answer:
      'While traditional SEO focuses on search engine rankings, AI Perception Engineering focuses on how AI language models understand and represent your brand. AI systems draw from different sources and use different reasoning, requiring specialized optimization strategies.',
  },
  {
    category: 'general',
    question: 'Can you help with negative AI perception?',
    answer:
      'Yes, we identify negative perception patterns across AI systems and provide actionable recommendations to improve how AI describes your brand. This includes addressing factual inaccuracies, outdated information, and sentiment issues.',
  },

  // Technical
  {
    category: 'technical',
    question: 'How do you measure AI perception?',
    answer:
      'We use a proprietary scoring system that analyzes multiple factors: mention frequency, sentiment analysis, factual accuracy, competitive positioning, recommendation likelihood, and knowledge graph completeness across different AI providers.',
  },
  {
    category: 'technical',
    question: 'What is the AI Perception Score?',
    answer:
      'The AI Perception Score is a 0-100 metric that quantifies how well AI systems understand and represent your brand. It combines sub-scores for visibility, accuracy, sentiment, authority, and competitive positioning.',
  },
  {
    category: 'technical',
    question: 'How often should I check my AI perception?',
    answer:
      'We recommend monitoring AI perception at least weekly, as AI models update frequently and market conditions change. Real-time monitoring helps you catch and address issues before they impact your brand.',
  },
  {
    category: 'technical',
    question: 'What data sources do AI systems use?',
    answer:
      'AI systems learn from various sources including Wikipedia, news articles, official websites, review platforms, social media, academic papers, and structured data like Schema.org markup. Optimizing these sources improves AI perception.',
  },
  {
    category: 'technical',
    question: 'How long does it take to improve AI perception?',
    answer:
      'Improvements vary based on the issues identified. Quick wins like Schema.org markup can show impact within weeks. More substantial changes to underlying data sources may take 1-3 months to reflect in AI responses.',
  },

  // Pricing
  {
    category: 'pricing',
    question: 'How much does the analysis cost?',
    answer:
      'We offer a free initial analysis that provides an overview of your AI perception score. Premium plans with detailed analysis, recommendations, and ongoing monitoring start at competitive rates. Contact us for specific pricing.',
  },
  {
    category: 'pricing',
    question: 'Is there a free trial available?',
    answer:
      'Yes, you can analyze your brand for free to get your AI Perception Score and basic recommendations. No credit card required to start.',
  },
  {
    category: 'pricing',
    question: 'What is included in premium plans?',
    answer:
      'Premium plans include: detailed multi-provider analysis, competitor comparison, actionable recommendations, weekly monitoring, trend tracking, alert notifications, and dedicated support for implementing improvements.',
  },

  // Results
  {
    category: 'results',
    question: 'What kind of results can I expect?',
    answer:
      'Clients typically see 20-40% improvement in AI perception scores within 3 months. This translates to better brand representation, more accurate information in AI responses, and improved recommendation likelihood.',
  },
  {
    category: 'results',
    question: 'How do you track improvement over time?',
    answer:
      'Our dashboard tracks your AI perception score trends, showing improvement across different providers and metrics. You can see historical data, compare periods, and measure the impact of specific optimizations.',
  },
  {
    category: 'results',
    question: 'Can you guarantee results?',
    answer:
      'While we cannot guarantee specific outcomes since AI systems are independently operated, our methodology is based on proven optimization principles. We provide transparent reporting so you can see measurable improvements.',
  },
];

// ================================================================
// JSON-LD SCHEMA
// ================================================================

function generateFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// ================================================================
// COMPONENTS
// ================================================================

function FAQCategory({
  title,
  items,
}: {
  title: string;
  items: FAQItem[];
}) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">
        {title}
      </h2>
      <div className="space-y-4">
        {items.map((item, index) => (
          <details
            key={index}
            className="group bg-gray-800/50 border border-gray-700 rounded-lg"
          >
            <summary className="flex items-center justify-between cursor-pointer p-4 text-white font-medium hover:bg-gray-800/80 transition-colors">
              <span className="pr-4">{item.question}</span>
              <svg
                className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4 text-gray-300 leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

// ================================================================
// MAIN PAGE
// ================================================================

export default function FAQPage() {
  const generalFAQs = faqItems.filter((item) => item.category === 'general');
  const technicalFAQs = faqItems.filter((item) => item.category === 'technical');
  const pricingFAQs = faqItems.filter((item) => item.category === 'pricing');
  const resultsFAQs = faqItems.filter((item) => item.category === 'results');

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema()) }}
      />

      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-b from-indigo-900/50 to-gray-900 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-300">
              Everything you need to know about AI Perception Engineering
            </p>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Quick Navigation */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-400 mb-3">Jump to section:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'General', href: '#general' },
                { label: 'Technical', href: '#technical' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Results', href: '#results' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* FAQ Sections */}
          <div id="general">
            <FAQCategory title="General Questions" items={generalFAQs} />
          </div>

          <div id="technical">
            <FAQCategory title="Technical Questions" items={technicalFAQs} />
          </div>

          <div id="pricing">
            <FAQCategory title="Pricing Questions" items={pricingFAQs} />
          </div>

          <div id="results">
            <FAQCategory title="Results & Expectations" items={resultsFAQs} />
          </div>

          {/* Still Have Questions */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-4">
              Still have questions?
            </h3>
            <p className="text-indigo-100 mb-6">
              We are here to help. Reach out to our team for personalized assistance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-400 transition-colors"
              >
                Try Free Analysis
              </Link>
            </div>
          </div>

          {/* Related Resources */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-white mb-4">Related Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/glossary"
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
              >
                <p className="font-medium text-white">Glossary</p>
                <p className="text-sm text-gray-400">AI perception terminology</p>
              </Link>
              <Link
                href="/help"
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
              >
                <p className="font-medium text-white">Help Center</p>
                <p className="text-sm text-gray-400">Detailed guides and tutorials</p>
              </Link>
              <Link
                href="/blog"
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
              >
                <p className="font-medium text-white">Blog</p>
                <p className="text-sm text-gray-400">Latest insights and updates</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center py-8 text-xs text-gray-500">
          <p>Last updated: December 2024</p>
        </div>
      </div>
    </>
  );
}
