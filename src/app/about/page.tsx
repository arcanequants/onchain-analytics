/**
 * About Page
 * Phase 4, Week 9 - Legal Pages
 *
 * Company and product information for AI Perception platform.
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | Vectorial Data',
  description: 'Learn about Vectorial Data - AI Perception Engineering platform that helps brands understand how AI systems see and recommend them.',
  openGraph: {
    title: 'About Us | Vectorial Data',
    description: 'AI Perception Engineering - discover how AI models perceive your brand.',
    type: 'website',
  },
};

const features = [
  {
    icon: '🤖',
    title: 'Multi-Model Analysis',
    description: 'Query OpenAI, Anthropic, Google, and Perplexity to see how each AI perceives your brand.',
  },
  {
    icon: '📊',
    title: 'Perception Scores',
    description: 'Get quantified scores for visibility, sentiment, authority, and competitive positioning.',
  },
  {
    icon: '🔍',
    title: 'Competitive Intelligence',
    description: 'Discover how AI systems rank you against competitors in your industry.',
  },
  {
    icon: '📈',
    title: 'Trend Monitoring',
    description: 'Track how AI perception of your brand changes over time with continuous monitoring.',
  },
  {
    icon: '💡',
    title: 'Actionable Recommendations',
    description: 'Get specific, prioritized actions to improve your AI visibility and perception.',
  },
  {
    icon: '🔐',
    title: 'Enterprise Security',
    description: 'SOC 2 compliant infrastructure with advanced data protection measures.',
  },
];

const stats = [
  { label: 'AI Providers', value: '4+' },
  { label: 'Industries Covered', value: '20+' },
  { label: 'Queries/Analysis', value: '50+' },
  { label: 'Uptime SLA', value: '99.9%' },
];

const team = [
  {
    name: 'Alberto Sorno',
    role: 'Founder & CEO',
    description: 'AI and analytics entrepreneur focused on helping brands navigate the AI-first future.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-indigo-900/50 to-gray-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            AI Perception Engineering for Modern Brands
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Vectorial Data helps you understand how AI systems perceive and recommend your brand,
            giving you the insights to thrive in an AI-first world.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center"
            >
              <p className="text-3xl font-bold text-indigo-400">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            As AI assistants become the primary way people discover and evaluate brands,
            understanding how these systems perceive you is critical. Our mission is to
            democratize AI perception analytics, giving every brand the tools to optimize
            their visibility across AI platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Transparency</h3>
            <p className="text-gray-300">
              We provide clear, actionable insights into how AI systems view your brand.
              No black boxes, no hidden agendas - just data you can act on.
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Innovation</h3>
            <p className="text-gray-300">
              We continuously evolve our platform as AI systems change, ensuring your
              brand perception strategy stays ahead of the curve.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800/30 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">What We Offer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-indigo-500 transition-colors"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Built on Modern Technology</h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">AI Infrastructure</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Multi-provider AI integration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Intelligent response caching
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Real-time perception scoring
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Historical trend analysis
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Platform Features</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Industry-specific analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Competitive benchmarking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Automated monitoring
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  API access for developers
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-800/30 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Leadership</h2>
          <div className="flex justify-center">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center max-w-sm"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                <p className="text-indigo-400 text-sm mb-3">{member.role}</p>
                <p className="text-gray-400 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-indigo-100 mb-6">
            Discover how AI systems perceive your brand and get actionable recommendations
            to improve your visibility.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Try Free Analysis
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-400 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Related Links */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h3 className="text-lg font-semibold text-white mb-4">Learn More</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/pricing"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
          >
            <p className="font-medium text-white">Pricing</p>
            <p className="text-sm text-gray-400">View our plans</p>
          </Link>
          <Link
            href="/faq"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
          >
            <p className="font-medium text-white">FAQ</p>
            <p className="text-sm text-gray-400">Common questions</p>
          </Link>
          <Link
            href="/contact"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
          >
            <p className="font-medium text-white">Contact</p>
            <p className="text-sm text-gray-400">Get in touch</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
