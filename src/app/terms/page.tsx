/**
 * Terms of Service Page
 * Phase 4, Week 9 - Legal Pages
 *
 * Terms and conditions for using the platform.
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Vectorial Data',
  description: 'Terms and conditions for using Vectorial Data on-chain analytics platform.',
  openGraph: {
    title: 'Terms of Service | Vectorial Data',
    description: 'Terms and conditions for using Vectorial Data on-chain analytics platform.',
    type: 'website',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-900/50 to-gray-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-300">Effective Date: December 3, 2024</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              Welcome to Vectorial Data (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your
              access to and use of our on-chain analytics platform, website, and related services
              (collectively, the &quot;Services&quot;). By accessing or using our Services, you agree to be bound
              by these Terms.
            </p>
          </section>

          {/* Eligibility */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Eligibility</h2>
            <p className="text-gray-300 leading-relaxed">
              You must be at least 18 years old to use our Services. By using our Services, you
              represent and warrant that you meet this requirement and have the legal capacity to
              enter into these Terms.
            </p>
          </section>

          {/* Account Registration */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              To access certain features of our Services, you may need to create an account. When
              creating an account, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update your account information if it changes</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use</h2>
            <p className="text-gray-300 leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Use the Services for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Services</li>
              <li>Scrape, crawl, or collect data in an automated manner without permission</li>
              <li>Resell or redistribute our Services without authorization</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the intellectual property rights of others</li>
            </ul>
          </section>

          {/* Data and Analytics */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data and Analytics</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Our Services provide on-chain analytics and data aggregation. You acknowledge that:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Data is provided &quot;as is&quot; from public blockchain sources</li>
              <li>We do not guarantee the accuracy, completeness, or timeliness of data</li>
              <li>Analytics should not be considered financial, investment, or trading advice</li>
              <li>You are solely responsible for decisions made based on our data</li>
              <li>Historical data may be subject to delays or corrections</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed">
              All content, features, and functionality of our Services, including but not limited to
              text, graphics, logos, icons, images, audio clips, data compilations, and software, are
              the exclusive property of Vectorial Data and are protected by intellectual property
              laws. You may not reproduce, distribute, modify, or create derivative works without our
              express written permission.
            </p>
          </section>

          {/* Subscription and Payments */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Subscription and Payments</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              If you subscribe to paid features:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>You agree to pay all applicable fees</li>
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>Prices may change with 30 days notice</li>
              <li>Refunds are provided according to our refund policy</li>
              <li>We may suspend access for non-payment</li>
            </ul>
          </section>

          {/* Disclaimer of Warranties */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-gray-300 leading-relaxed">
              THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
              WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, VECTORIAL DATA SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
              PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE,
              GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          {/* Indemnification */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p className="text-gray-300 leading-relaxed">
              You agree to indemnify, defend, and hold harmless Vectorial Data and its officers,
              directors, employees, and agents from any claims, liabilities, damages, losses, and
              expenses arising from your use of the Services or violation of these Terms.
            </p>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Termination</h2>
            <p className="text-gray-300 leading-relaxed">
              We may terminate or suspend your access to the Services immediately, without prior
              notice, for any reason, including breach of these Terms. Upon termination, your right
              to use the Services will cease immediately.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Governing Law</h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the
              jurisdiction in which Vectorial Data is incorporated, without regard to its conflict of
              law provisions.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of any
              changes by posting the new Terms on this page and updating the &quot;Effective Date.&quot; Your
              continued use of the Services after such changes constitutes acceptance of the new
              Terms.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@vectorialdata.com" className="text-indigo-400 hover:text-indigo-300">
                legal@vectorialdata.com
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
              href="/cookies"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
            >
              <p className="font-medium text-white">Cookie Policy</p>
              <p className="text-sm text-gray-400">Our use of cookies</p>
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
