/**
 * Contact Page
 * Phase 4, Week 9 - Legal Pages
 *
 * Contact information and form.
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | Vectorial Data',
  description: 'Get in touch with the Vectorial Data team for support, sales, or partnership inquiries.',
  openGraph: {
    title: 'Contact Us | Vectorial Data',
    description: 'Get in touch with the Vectorial Data team.',
    type: 'website',
  },
};

const contactMethods = [
  {
    icon: '📧',
    title: 'General Inquiries',
    email: 'hello@vectorialdata.com',
    description: 'For general questions about our platform.',
  },
  {
    icon: '🛠️',
    title: 'Technical Support',
    email: 'support@vectorialdata.com',
    description: 'For help with technical issues or bugs.',
  },
  {
    icon: '💼',
    title: 'Sales & Enterprise',
    email: 'sales@vectorialdata.com',
    description: 'For enterprise plans and custom solutions.',
  },
  {
    icon: '🤝',
    title: 'Partnerships',
    email: 'partners@vectorialdata.com',
    description: 'For integration and partnership opportunities.',
  },
  {
    icon: '📰',
    title: 'Press & Media',
    email: 'press@vectorialdata.com',
    description: 'For media inquiries and press requests.',
  },
  {
    icon: '🔐',
    title: 'Security',
    email: 'security@vectorialdata.com',
    description: 'For responsible disclosure of security issues.',
  },
];

const faqItems = [
  {
    question: 'What are your support hours?',
    answer: 'Our support team is available Monday through Friday, 9 AM to 6 PM EST. Premium customers have access to 24/7 priority support.',
  },
  {
    question: 'How quickly do you respond?',
    answer: 'We aim to respond to all inquiries within 24 hours. Priority support tickets are typically answered within 2-4 hours.',
  },
  {
    question: 'Do you offer phone support?',
    answer: 'Phone support is available for Enterprise customers. Standard and Pro plans receive email and chat support.',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-900/50 to-gray-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-xl text-gray-300">
            We&apos;d love to hear from you. Choose the best way to reach us.
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contactMethods.map((method) => (
            <div
              key={method.title}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-indigo-500 transition-colors"
            >
              <div className="text-3xl mb-4">{method.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{method.title}</h3>
              <p className="text-gray-400 text-sm mb-3">{method.description}</p>
              <a
                href={`mailto:${method.email}`}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                {method.email}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Send Us a Message</h2>

          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a topic</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="sales">Sales & Pricing</option>
                <option value="enterprise">Enterprise Solutions</option>
                <option value="partnership">Partnership Opportunity</option>
                <option value="feedback">Product Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="How can we help you?"
              ></textarea>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="privacy"
                name="privacy"
                className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-900 text-indigo-500 focus:ring-indigo-500"
              />
              <label htmlFor="privacy" className="text-sm text-gray-400">
                I agree to the{' '}
                <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">
                  Privacy Policy
                </Link>{' '}
                and consent to being contacted regarding my inquiry.
              </label>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Send Message
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            We typically respond within 24 hours during business days.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <details
              key={index}
              className="group bg-gray-800/50 border border-gray-700 rounded-lg"
            >
              <summary className="flex items-center justify-between cursor-pointer p-4 text-white font-medium hover:bg-gray-800/80 transition-colors">
                <span>{item.question}</span>
                <svg
                  className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 text-gray-300">{item.answer}</div>
            </details>
          ))}
        </div>
        <p className="text-center text-gray-400 mt-6">
          Have more questions?{' '}
          <Link href="/faq" className="text-indigo-400 hover:text-indigo-300">
            Visit our full FAQ
          </Link>
        </p>
      </div>

      {/* Office Info */}
      <div className="bg-gray-800/30 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Connect With Us</h3>
              <div className="space-y-3 text-gray-300">
                <p className="flex items-center gap-3">
                  <span className="text-xl">🐦</span>
                  <a
                    href="https://twitter.com/vectorialdata"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    @vectorialdata
                  </a>
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-xl">💬</span>
                  <a
                    href="https://discord.gg/vectorialdata"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Discord Community
                  </a>
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-xl">📝</span>
                  <a
                    href="https://github.com/vectorialdata"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    GitHub
                  </a>
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Business Hours</h3>
              <div className="space-y-2 text-gray-300">
                <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                <p>Saturday - Sunday: Closed</p>
                <p className="text-sm text-gray-500 mt-4">
                  Enterprise customers have access to 24/7 support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Links */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/help"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
          >
            <p className="font-medium text-white">Help Center</p>
            <p className="text-sm text-gray-400">Browse documentation</p>
          </Link>
          <Link
            href="/faq"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
          >
            <p className="font-medium text-white">FAQ</p>
            <p className="text-sm text-gray-400">Common questions</p>
          </Link>
          <Link
            href="/about"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
          >
            <p className="font-medium text-white">About Us</p>
            <p className="text-sm text-gray-400">Learn about our team</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
