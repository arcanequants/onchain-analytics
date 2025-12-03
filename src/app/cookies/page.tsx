/**
 * Cookie Policy Page
 * Phase 4, Week 9 - Legal Pages
 *
 * Cookie usage disclosure and consent information.
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | Vectorial Data',
  description: 'Learn about how Vectorial Data uses cookies and similar technologies.',
  openGraph: {
    title: 'Cookie Policy | Vectorial Data',
    description: 'Learn about how Vectorial Data uses cookies and similar technologies.',
    type: 'website',
  },
};

interface CookieInfo {
  name: string;
  purpose: string;
  duration: string;
  type: 'essential' | 'analytics' | 'functional' | 'marketing';
}

const cookies: CookieInfo[] = [
  {
    name: 'session',
    purpose: 'Maintains your login session',
    duration: '7 days',
    type: 'essential',
  },
  {
    name: 'csrf_token',
    purpose: 'Protects against cross-site request forgery',
    duration: 'Session',
    type: 'essential',
  },
  {
    name: 'cookie_consent',
    purpose: 'Stores your cookie preferences',
    duration: '1 year',
    type: 'essential',
  },
  {
    name: '_ga',
    purpose: 'Google Analytics - distinguishes users',
    duration: '2 years',
    type: 'analytics',
  },
  {
    name: '_ga_*',
    purpose: 'Google Analytics - maintains session state',
    duration: '2 years',
    type: 'analytics',
  },
  {
    name: 'theme',
    purpose: 'Remembers your theme preference (dark/light)',
    duration: '1 year',
    type: 'functional',
  },
  {
    name: 'timezone',
    purpose: 'Stores your timezone for data display',
    duration: '1 year',
    type: 'functional',
  },
];

export default function CookiePolicyPage() {
  const essentialCookies = cookies.filter((c) => c.type === 'essential');
  const analyticsCookies = cookies.filter((c) => c.type === 'analytics');
  const functionalCookies = cookies.filter((c) => c.type === 'functional');
  const marketingCookies = cookies.filter((c) => c.type === 'marketing');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-900/50 to-gray-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Cookie Policy</h1>
          <p className="text-xl text-gray-300">Effective Date: December 3, 2024</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">What Are Cookies?</h2>
            <p className="text-gray-300 leading-relaxed">
              Cookies are small text files that are stored on your device when you visit a website.
              They help websites remember your preferences, understand how you use the site, and
              improve your experience. We use cookies and similar technologies (like local storage)
              to provide, protect, and improve our Services.
            </p>
          </section>

          {/* Types of Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Types of Cookies We Use</h2>

            {/* Essential Cookies */}
            <div className="mb-6">
              <h3 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Essential Cookies
              </h3>
              <p className="text-gray-300 mb-4">
                These cookies are necessary for the website to function and cannot be switched off.
                They are usually only set in response to actions made by you, such as logging in or
                filling in forms.
              </p>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-300">Cookie</th>
                      <th className="px-4 py-2 text-left text-gray-300">Purpose</th>
                      <th className="px-4 py-2 text-left text-gray-300">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {essentialCookies.map((cookie) => (
                      <tr key={cookie.name} className="border-t border-gray-700">
                        <td className="px-4 py-2 text-gray-400 font-mono">{cookie.name}</td>
                        <td className="px-4 py-2 text-gray-300">{cookie.purpose}</td>
                        <td className="px-4 py-2 text-gray-400">{cookie.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="mb-6">
              <h3 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                Analytics Cookies
              </h3>
              <p className="text-gray-300 mb-4">
                These cookies help us understand how visitors interact with our website by collecting
                and reporting information anonymously. This helps us improve our Services.
              </p>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-300">Cookie</th>
                      <th className="px-4 py-2 text-left text-gray-300">Purpose</th>
                      <th className="px-4 py-2 text-left text-gray-300">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsCookies.map((cookie) => (
                      <tr key={cookie.name} className="border-t border-gray-700">
                        <td className="px-4 py-2 text-gray-400 font-mono">{cookie.name}</td>
                        <td className="px-4 py-2 text-gray-300">{cookie.purpose}</td>
                        <td className="px-4 py-2 text-gray-400">{cookie.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="mb-6">
              <h3 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                Functional Cookies
              </h3>
              <p className="text-gray-300 mb-4">
                These cookies enable enhanced functionality and personalization, such as remembering
                your preferences. They may be set by us or by third-party providers.
              </p>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-300">Cookie</th>
                      <th className="px-4 py-2 text-left text-gray-300">Purpose</th>
                      <th className="px-4 py-2 text-left text-gray-300">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {functionalCookies.map((cookie) => (
                      <tr key={cookie.name} className="border-t border-gray-700">
                        <td className="px-4 py-2 text-gray-400 font-mono">{cookie.name}</td>
                        <td className="px-4 py-2 text-gray-300">{cookie.purpose}</td>
                        <td className="px-4 py-2 text-gray-400">{cookie.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Marketing Cookies */}
            {marketingCookies.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                  Marketing Cookies
                </h3>
                <p className="text-gray-300 mb-4">
                  These cookies may be set by our advertising partners to build a profile of your
                  interests and show you relevant ads on other sites.
                </p>
              </div>
            )}
          </section>

          {/* Managing Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Managing Your Cookie Preferences</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You can control and manage cookies in several ways:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>
                <strong>Browser Settings:</strong> Most browsers allow you to refuse or delete
                cookies. Check your browser&apos;s help section for instructions.
              </li>
              <li>
                <strong>Cookie Banner:</strong> When you first visit our site, you can accept or
                reject non-essential cookies through our cookie banner.
              </li>
              <li>
                <strong>Opt-Out Links:</strong> For Google Analytics, you can install the{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
              </li>
            </ul>
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <p className="text-yellow-200 text-sm">
                <strong>Note:</strong> Disabling certain cookies may affect the functionality of our
                website. Essential cookies cannot be disabled as they are necessary for the site to
                work.
              </p>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Cookies</h2>
            <p className="text-gray-300 leading-relaxed">
              Some cookies on our site are set by third-party services. These include analytics
              providers and other service partners. These third parties have their own privacy
              policies governing how they use your data. We recommend reviewing their policies:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Vercel Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          {/* Updates */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Updates to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices
              or for legal, operational, or regulatory reasons. We will notify you of any material
              changes by posting the new policy on this page with an updated effective date.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about our use of cookies, please contact us at{' '}
              <a href="mailto:privacy@vectorialdata.com" className="text-indigo-400 hover:text-indigo-300">
                privacy@vectorialdata.com
              </a>
            </p>
          </section>
        </div>

        {/* Related Links */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Related Policies</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/privacy"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
            >
              <p className="font-medium text-white">Privacy Policy</p>
              <p className="text-sm text-gray-400">How we handle your data</p>
            </Link>
            <Link
              href="/terms"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
            >
              <p className="font-medium text-white">Terms of Service</p>
              <p className="text-sm text-gray-400">Our terms and conditions</p>
            </Link>
            <Link
              href="/contact"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
            >
              <p className="font-medium text-white">Contact Us</p>
              <p className="text-sm text-gray-400">Get in touch</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center py-8 text-xs text-gray-500">
        <p>Last updated: December 3, 2024</p>
      </div>
    </div>
  );
}
