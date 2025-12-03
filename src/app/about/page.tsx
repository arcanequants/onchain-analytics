/**
 * About Page
 * Phase 4, Week 9 - Legal Pages
 *
 * Company and product information.
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | Vectorial Data',
  description: 'Learn about Vectorial Data - your comprehensive on-chain analytics platform for crypto and DeFi insights.',
  openGraph: {
    title: 'About Us | Vectorial Data',
    description: 'Learn about Vectorial Data - your comprehensive on-chain analytics platform.',
    type: 'website',
  },
};

const features = [
  {
    icon: '📊',
    title: 'Real-Time Analytics',
    description: 'Track gas prices, token prices, DEX volumes, and TVL data updated every minute.',
  },
  {
    icon: '👛',
    title: 'Wallet Tracking',
    description: 'Monitor wallet balances, NFT holdings, and transaction history across multiple chains.',
  },
  {
    icon: '🏦',
    title: 'DeFi Insights',
    description: 'Comprehensive TVL tracking and DEX volume analysis across major protocols.',
  },
  {
    icon: '📈',
    title: 'Market Intelligence',
    description: 'Fear & Greed Index, trending tokens, and market sentiment indicators.',
  },
  {
    icon: '🔔',
    title: 'Smart Alerts',
    description: 'Customizable alerts for price movements, whale transactions, and market events.',
  },
  {
    icon: '🔐',
    title: 'Enterprise Security',
    description: 'SOC 2 compliant infrastructure with advanced data protection measures.',
  },
];

const stats = [
  { label: 'Chains Supported', value: '5+' },
  { label: 'Protocols Tracked', value: '100+' },
  { label: 'Data Points/Day', value: '1M+' },
  { label: 'Uptime SLA', value: '99.9%' },
];

const team = [
  {
    name: 'Alberto Sorno',
    role: 'Founder & CEO',
    description: 'Blockchain entrepreneur with deep expertise in DeFi and on-chain analytics.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-indigo-900/50 to-gray-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            On-Chain Intelligence for the Modern Investor
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Vectorial Data provides comprehensive blockchain analytics to help you make informed
            decisions in the fast-moving world of crypto and DeFi.
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
            We believe that access to quality on-chain data should be available to everyone, not
            just institutions. Our mission is to democratize blockchain analytics, providing
            retail investors and traders with the same powerful tools used by professional firms.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Transparency</h3>
            <p className="text-gray-300">
              We&apos;re committed to providing accurate, unbiased data directly from blockchain
              sources. No manipulation, no hidden agendas.
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Innovation</h3>
            <p className="text-gray-300">
              We continuously push the boundaries of what&apos;s possible with on-chain analytics,
              incorporating AI and machine learning for deeper insights.
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
              <h3 className="text-lg font-semibold text-white mb-4">Data Infrastructure</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Real-time blockchain node connections
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Multi-provider data aggregation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Sub-second data latency
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Historical data archive
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Platform Features</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  REST and WebSocket APIs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Custom webhook integrations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Advanced charting tools
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Export to CSV/JSON
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
            Join thousands of traders and investors using Vectorial Data for their on-chain
            analytics needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              View Dashboard
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
