/**
 * Help Center Landing Page
 *
 * Phase 2, Week 3, Day 5
 * Help articles hub with 10 core articles
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Help Center - AI Perception Engineering',
  description: 'Learn how to optimize your brand visibility in AI systems with our comprehensive guides and tutorials.',
  openGraph: {
    title: 'Help Center - AI Perception Engineering',
    description: 'Guides and tutorials for AI perception optimization.',
  },
};

// ================================================================
// HELP ARTICLES DATA
// ================================================================

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'optimization' | 'analysis' | 'advanced';
  readTime: string;
  icon: string;
}

const helpArticles: HelpArticle[] = [
  // Getting Started
  {
    id: 'understanding-ai-perception',
    title: 'Understanding AI Perception',
    description: 'Learn what AI perception is and why it matters for your brand visibility in the age of AI assistants.',
    category: 'getting-started',
    readTime: '5 min',
    icon: '1',
  },
  {
    id: 'how-scoring-works',
    title: 'How the AI Perception Score Works',
    description: 'A detailed breakdown of our scoring methodology and what each metric means for your brand.',
    category: 'getting-started',
    readTime: '8 min',
    icon: '2',
  },
  {
    id: 'first-analysis',
    title: 'Running Your First Analysis',
    description: 'Step-by-step guide to analyzing your brand presence across major AI platforms.',
    category: 'getting-started',
    readTime: '4 min',
    icon: '3',
  },

  // Optimization
  {
    id: 'schema-markup-guide',
    title: 'Complete Schema Markup Guide',
    description: 'Learn how to implement structured data that helps AI systems understand your brand.',
    category: 'optimization',
    readTime: '12 min',
    icon: '4',
  },
  {
    id: 'content-optimization',
    title: 'Optimizing Content for AI',
    description: 'Best practices for creating content that AI systems recognize and recommend.',
    category: 'optimization',
    readTime: '10 min',
    icon: '5',
  },
  {
    id: 'building-authority',
    title: 'Building Authority Signals',
    description: 'Strategies for establishing your brand as an authoritative source that AI models trust.',
    category: 'optimization',
    readTime: '8 min',
    icon: '6',
  },

  // Analysis
  {
    id: 'interpreting-results',
    title: 'Interpreting Your Results',
    description: 'How to read and understand your AI perception analysis report.',
    category: 'analysis',
    readTime: '6 min',
    icon: '7',
  },
  {
    id: 'competitor-analysis',
    title: 'Analyzing Competitors',
    description: 'Use competitive insights to identify opportunities and improve your positioning.',
    category: 'analysis',
    readTime: '7 min',
    icon: '8',
  },

  // Advanced
  {
    id: 'ai-provider-differences',
    title: 'AI Provider Differences',
    description: 'Understanding how different AI platforms (ChatGPT, Claude, Gemini) perceive brands differently.',
    category: 'advanced',
    readTime: '10 min',
    icon: '9',
  },
  {
    id: 'crisis-management',
    title: 'AI Reputation Crisis Management',
    description: 'How to identify and address negative AI perception before it impacts your business.',
    category: 'advanced',
    readTime: '9 min',
    icon: '10',
  },
];

// ================================================================
// COMPONENTS
// ================================================================

function ArticleCard({ article }: { article: HelpArticle }) {
  return (
    <Link
      href={`/help/${article.id}`}
      className="bg-gray-800/50 border border-gray-700 rounded-lg p-5 hover:border-indigo-500 hover:bg-gray-800/80 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400 font-bold group-hover:bg-indigo-600/30 transition-colors">
          {article.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium group-hover:text-indigo-400 transition-colors">
            {article.title}
          </h3>
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">
            {article.description}
          </p>
          <p className="text-xs text-gray-500 mt-2">{article.readTime} read</p>
        </div>
      </div>
    </Link>
  );
}

function CategorySection({
  title,
  description,
  articles,
}: {
  title: string;
  description: string;
  articles: HelpArticle[];
}) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-gray-400 text-sm mt-1">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

// ================================================================
// MAIN PAGE
// ================================================================

export default function HelpCenterPage() {
  const gettingStarted = helpArticles.filter((a) => a.category === 'getting-started');
  const optimization = helpArticles.filter((a) => a.category === 'optimization');
  const analysis = helpArticles.filter((a) => a.category === 'analysis');
  const advanced = helpArticles.filter((a) => a.category === 'advanced');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-900/50 to-gray-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Help Center</h1>
          <p className="text-xl text-gray-300">
            Learn how to optimize your brand visibility in AI systems
          </p>

          {/* Search (placeholder) */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search help articles..."
                className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Links */}
        <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-lg p-6 mb-12">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/help/understanding-ai-perception"
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              What is AI Perception?
            </Link>
            <Link
              href="/help/first-analysis"
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Run First Analysis
            </Link>
            <Link
              href="/faq"
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              View FAQ
            </Link>
            <Link
              href="/glossary"
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Terminology Glossary
            </Link>
          </div>
        </div>

        {/* Categories */}
        <CategorySection
          title="Getting Started"
          description="New to AI Perception? Start here."
          articles={gettingStarted}
        />

        <CategorySection
          title="Optimization Guides"
          description="Improve your AI perception score with these strategies."
          articles={optimization}
        />

        <CategorySection
          title="Understanding Your Analysis"
          description="Learn how to interpret and act on your results."
          articles={analysis}
        />

        <CategorySection
          title="Advanced Topics"
          description="Deep dives for power users."
          articles={advanced}
        />

        {/* Contact Support */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center mt-12">
          <h3 className="text-xl font-semibold text-white mb-2">
            Need more help?
          </h3>
          <p className="text-gray-400 mb-6">
            Our team is here to assist you with any questions.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
