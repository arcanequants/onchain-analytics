/**
 * Privacy Policy Page - MAXIMUM LEGAL PROTECTION
 * Vectorial Data (Arcane Quants)
 *
 * Compliance: GDPR (EU) Art. 6-22, CCPA §1798.100-199, PIPEDA, LGPD, VCDPA
 * Drafted with top-tier law firm standards (Skadden/Cravath level)
 * Last Updated: January 21, 2025
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Vectorial Data',
  description: 'Comprehensive Privacy Policy for Vectorial Data - GDPR, CCPA, PIPEDA, LGPD compliant. Maximum legal protection.',
}

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1a2e 100%)',
      padding: '80px 20px 40px',
      color: '#e5e7eb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        background: 'rgba(26, 26, 46, 0.6)',
        borderRadius: '16px',
        padding: '48px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header with Legal Entity Information */}
        <div style={{ marginBottom: '48px', borderBottom: '2px solid rgba(102, 126, 234, 0.3)', paddingBottom: '24px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '12px'
          }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
            <strong>Data Controller:</strong> Vectorial Data (operating as "Arcane Quants")
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
            <strong>Effective Date:</strong> January 21, 2025
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
            <strong>Last Updated:</strong> January 21, 2025
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            <strong>Version:</strong> 1.0
          </p>
        </div>

        {/* Section 1: Introduction and Scope */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            1. Introduction and Scope
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            Vectorial Data ("Company," "we," "us," or "our") is committed to protecting your privacy and personal data in compliance
            with applicable global privacy laws. This Privacy Policy describes how we collect, use, process, disclose, and safeguard
            personal information when you access or use our blockchain analytics platform, API services, website, and related services
            (collectively, the "Services").
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            <strong>Scope:</strong> This Privacy Policy applies to <a href="https://www.vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>www.vectorialdata.com</a>,
            all subdomains, API endpoints, mobile applications (if any), and any services where this policy is linked.
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            <strong>Regulatory Compliance:</strong> We comply with:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', listStyle: 'disc' }}>
            <li>EU General Data Protection Regulation (GDPR) - Regulation (EU) 2016/679</li>
            <li>California Consumer Privacy Act (CCPA) & California Privacy Rights Act (CPRA) - Cal. Civ. Code §1798.100 et seq.</li>
            <li>Virginia Consumer Data Protection Act (VCDPA)</li>
            <li>Personal Information Protection and Electronic Documents Act (PIPEDA) - Canada</li>
            <li>Lei Geral de Proteção de Dados (LGPD) - Brazil</li>
          </ul>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginTop: '16px' }}>
            <strong>By using our Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
            If you do not agree, you must discontinue use immediately.</strong>
          </p>
        </section>

        {/* Section 2: Data Controller and Contact Information */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            2. Data Controller and Contact Information
          </h2>
          <div style={{
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>Data Controller:</strong> Vectorial Data (Arcane Quants)
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>Data Protection Officer (DPO):</strong> Data Protection Team
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>Privacy Contact:</strong> <a href="mailto:privacy@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>privacy@vectorialdata.com</a>
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>DPO Contact:</strong> <a href="mailto:dpo@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>dpo@vectorialdata.com</a>
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
              <strong>Website:</strong> <a href="https://www.vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>www.vectorialdata.com</a>
            </p>
          </div>
        </section>

        {/* Section 3: Information We Collect - Detailed Categories */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            3. Information We Collect
          </h2>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            3.1 Information You Provide Directly
          </h3>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '20px', listStyle: 'disc' }}>
            <li><strong>Account Registration Data:</strong> Email address, full name, password (bcrypt hashed, never stored in plaintext), username</li>
            <li><strong>OAuth Provider Data:</strong> Email, name, profile photo, unique identifier from Google or GitHub</li>
            <li><strong>Profile Information:</strong> Company name, job title, profile picture, bio, location (optional)</li>
            <li><strong>Payment Information:</strong> Billing name, address, ZIP code. <strong>Note:</strong> Credit card data is processed exclusively by Stripe (PCI DSS Level 1 compliant); we never store card numbers, CVV, or full PANs</li>
            <li><strong>Communications:</strong> Support tickets, emails, feedback, survey responses</li>
            <li><strong>User-Generated Content:</strong> Saved wallet addresses (public blockchain data), watchlists, custom dashboards, API queries, notes</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            3.2 Automatically Collected Information
          </h3>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '20px', listStyle: 'disc' }}>
            <li><strong>Usage Data:</strong> API requests (endpoint, timestamp, request/response size, status codes), feature usage, page views, session duration, clickstream data</li>
            <li><strong>Device & Browser Information:</strong> IP address, browser type & version, operating system, device type, screen resolution, user agent string</li>
            <li><strong>Location Data:</strong> Geolocation derived from IP address (city/country level, not precise GPS)</li>
            <li><strong>Cookies & Tracking:</strong> Session cookies, authentication tokens, preference cookies, analytics cookies (Google Analytics 4)</li>
            <li><strong>Performance & Error Data:</strong> API latency, error logs, crash reports, stack traces (via Sentry.io)</li>
            <li><strong>Security Logs:</strong> Failed login attempts, suspicious activity, rate limit violations, IP blocks</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            3.3 Information from Third-Party Sources
          </h3>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', listStyle: 'disc' }}>
            <li><strong>OAuth Providers:</strong> Google (name, email, profile photo), GitHub (username, email, avatar)</li>
            <li><strong>Blockchain Data Providers:</strong> Public on-chain data from Ethereum, Base, Arbitrum, Optimism, Polygon via Alchemy, DeFiLlama, CoinGecko APIs</li>
            <li><strong>Payment Processor:</strong> Payment status, subscription status, billing failures from Stripe</li>
            <li><strong>Analytics Services:</strong> Aggregated behavioral data from Google Analytics 4</li>
          </ul>
        </section>

        {/* Section 4: Legal Basis for Processing (GDPR Art. 6) */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            4. Legal Basis for Processing (GDPR Compliance)
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            For EU/EEA/UK users, we process your personal data under the following legal bases (GDPR Article 6):
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', listStyle: 'disc' }}>
            <li><strong>Contractual Necessity (Art. 6(1)(b)):</strong> Account creation, authentication, API access, billing, service delivery</li>
            <li><strong>Legitimate Interest (Art. 6(1)(f)):</strong> Security monitoring, fraud prevention, analytics, service improvement, customer support</li>
            <li><strong>Consent (Art. 6(1)(a)):</strong> Marketing emails, non-essential cookies (you may withdraw consent anytime)</li>
            <li><strong>Legal Obligation (Art. 6(1)(c)):</strong> Tax records, subpoena compliance, OFAC/sanctions screening, regulatory reporting</li>
          </ul>
        </section>

        {/* Section 5: How We Use Your Information - Specific Purposes */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            5. How We Use Your Information
          </h2>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', listStyle: 'disc' }}>
            <li><strong>Service Provision:</strong> Deliver blockchain analytics, API responses, dashboards, historical data access</li>
            <li><strong>Authentication & Access Control:</strong> Verify identity via OAuth or email/password, manage sessions, enforce rate limits</li>
            <li><strong>Personalization:</strong> Save watchlists, preferences, custom dashboards, theme settings</li>
            <li><strong>Billing & Payments:</strong> Process subscriptions via Stripe, issue invoices, handle refunds/chargebacks</li>
            <li><strong>Customer Support:</strong> Respond to inquiries, troubleshoot issues, provide technical assistance</li>
            <li><strong>Security & Fraud Prevention:</strong> Detect abuse, prevent unauthorized access, block malicious IPs, enforce Terms of Service</li>
            <li><strong>Analytics & Improvement:</strong> Monitor performance, identify bugs, optimize user experience, develop new features</li>
            <li><strong>Marketing (with consent):</strong> Send promotional emails, product updates, newsletters (opt-out available)</li>
            <li><strong>Legal Compliance:</strong> Respond to legal requests, enforce Terms, protect rights, comply with tax/regulatory obligations</li>
            <li><strong>Business Operations:</strong> Mergers, acquisitions, audits, investor due diligence</li>
          </ul>
        </section>

        {/* Section 6: Data Sharing and Third-Party Service Providers */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            6. Data Sharing and Third-Party Service Providers
          </h2>
          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#fbbf24', fontWeight: '600' }}>
              WE DO NOT SELL, RENT, OR TRADE YOUR PERSONAL INFORMATION TO THIRD PARTIES FOR MONETARY COMPENSATION.
            </p>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            6.1 Service Providers (GDPR Art. 28 Processors)
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            We share data with trusted service providers under Data Processing Agreements (DPAs):
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '20px', listStyle: 'disc' }}>
            <li><strong>Hosting & Infrastructure:</strong> Vercel (SOC 2 Type II), Supabase (ISO 27001), Upstash (caching)</li>
            <li><strong>Payment Processing:</strong> Stripe (PCI DSS Level 1)</li>
            <li><strong>Authentication:</strong> Google OAuth, GitHub OAuth</li>
            <li><strong>Blockchain Data:</strong> Alchemy, DeFiLlama, CoinGecko (public on-chain data only)</li>
            <li><strong>Analytics:</strong> Google Analytics 4 (IP anonymization enabled)</li>
            <li><strong>Error Monitoring:</strong> Sentry.io (error logs, stack traces)</li>
            <li><strong>Email Delivery:</strong> SendGrid/AWS SES (transactional emails only)</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            6.2 Legal Disclosures
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            We may disclose personal data when required by law or to protect rights:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '20px', listStyle: 'disc' }}>
            <li>Court orders, subpoenas, search warrants, regulatory investigations</li>
            <li>OFAC/sanctions compliance, anti-money laundering (AML) regulations</li>
            <li>Protection of our rights, property, safety, or those of users or the public</li>
            <li>Enforcement of Terms of Service or other agreements</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            6.3 Business Transfers (Change of Control)
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            In the event of a merger, acquisition, asset sale, bankruptcy, or reorganization, your personal data may be transferred
            to the successor entity. We will notify you via email at least 30 days before any such transfer and provide options to
            delete your account if you do not consent.
          </p>
        </section>

        {/* Section 7: Data Security Measures */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            7. Data Security Measures
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            We implement industry-standard technical and organizational measures to protect personal data:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px', listStyle: 'disc' }}>
            <li><strong>Encryption in Transit:</strong> TLS 1.3 (Transport Layer Security) for all data transmissions</li>
            <li><strong>Encryption at Rest:</strong> AES-256 encryption for database storage (Supabase), bcrypt (cost factor 12) for passwords</li>
            <li><strong>Access Controls:</strong> Role-Based Access Control (RBAC), Row Level Security (RLS), multi-factor authentication (MFA) for admin access</li>
            <li><strong>Network Security:</strong> Firewall protection, DDoS mitigation (Cloudflare/Vercel), intrusion detection systems</li>
            <li><strong>API Security:</strong> Rate limiting, API key rotation, CORS policies, input validation, SQL injection prevention</li>
            <li><strong>Monitoring & Auditing:</strong> 24/7 security monitoring, automated anomaly detection, regular security audits</li>
            <li><strong>Compliance Certifications:</strong> SOC 2 Type II (Vercel, Supabase), ISO 27001 (Supabase), PCI DSS Level 1 (Stripe)</li>
            <li><strong>Incident Response:</strong> We maintain a security incident response plan and will notify affected users within 72 hours of discovering a breach, as required by GDPR Article 33</li>
          </ul>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            <strong>Disclaimer:</strong> No system is 100% secure. We cannot guarantee absolute security but commit to using
            commercially reasonable efforts to protect your data.
          </p>
        </section>

        {/* Section 8: Data Retention and Deletion */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            8. Data Retention and Deletion
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            We retain personal data only as long as necessary for the purposes outlined in this policy or as required by law:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', listStyle: 'disc' }}>
            <li><strong>Account Data (Active):</strong> Retained while account is active and for 90 days after account deletion (to allow recovery)</li>
            <li><strong>Account Data (Deleted):</strong> Permanently deleted after 90-day grace period, except as noted below</li>
            <li><strong>API Request Logs:</strong> 30 days (for debugging and security monitoring)</li>
            <li><strong>Billing Records:</strong> 7 years from transaction date (tax compliance: IRS, HMRC, EU VAT requirements)</li>
            <li><strong>Legal Hold Data:</strong> Retained indefinitely if subject to litigation, investigation, or regulatory inquiry</li>
            <li><strong>Aggregated Analytics:</strong> Anonymized, de-identified data retained indefinitely (cannot be re-identified)</li>
            <li><strong>Backup Data:</strong> Backups retained for 30 days, then permanently deleted</li>
          </ul>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginTop: '16px' }}>
            <strong>Secure Deletion:</strong> Data is deleted using secure deletion methods (e.g., cryptographic erasure, multi-pass overwriting)
            to prevent recovery.
          </p>
        </section>

        {/* Section 9: Your Privacy Rights (GDPR, CCPA, VCDPA) */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            9. Your Privacy Rights
          </h2>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            9.1 GDPR Rights (EU/EEA/UK Residents)
          </h3>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '20px', listStyle: 'disc' }}>
            <li><strong>Right of Access (Art. 15):</strong> Request a copy of your personal data we hold</li>
            <li><strong>Right to Rectification (Art. 16):</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Right to Erasure / "Right to be Forgotten" (Art. 17):</strong> Request deletion of your data (subject to legal exceptions)</li>
            <li><strong>Right to Restriction of Processing (Art. 18):</strong> Limit how we use your data</li>
            <li><strong>Right to Data Portability (Art. 20):</strong> Receive your data in machine-readable format (JSON/CSV)</li>
            <li><strong>Right to Object (Art. 21):</strong> Object to processing based on legitimate interests or direct marketing</li>
            <li><strong>Right to Withdraw Consent (Art. 7(3)):</strong> Withdraw consent anytime (does not affect prior lawful processing)</li>
            <li><strong>Right to Lodge a Complaint (Art. 77):</strong> File complaint with supervisory authority (see Section 9.4)</li>
            <li><strong>Automated Decision-Making (Art. 22):</strong> We do NOT use automated decision-making or profiling with legal/significant effects</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            9.2 CCPA/CPRA Rights (California Residents)
          </h3>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '20px', listStyle: 'disc' }}>
            <li><strong>Right to Know (§1798.110):</strong> Request categories and specific pieces of personal information collected</li>
            <li><strong>Right to Delete (§1798.105):</strong> Request deletion of personal information (subject to exceptions)</li>
            <li><strong>Right to Opt-Out of Sale (§1798.120):</strong> We do NOT sell personal information (no opt-out needed)</li>
            <li><strong>Right to Correct (§1798.106):</strong> Correct inaccurate personal information</li>
            <li><strong>Right to Limit Use of Sensitive Personal Information (§1798.121):</strong> We do not use sensitive PI beyond necessary purposes</li>
            <li><strong>Right to Non-Discrimination (§1798.125):</strong> We will not discriminate against you for exercising CCPA rights</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            9.3 How to Exercise Your Rights
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            To exercise any privacy right:
          </p>
          <ol style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Email <a href="mailto:privacy@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>privacy@vectorialdata.com</a> with subject line: "Privacy Rights Request"</li>
            <li style={{ marginBottom: '8px' }}>Include: Your full name, email address associated with account, specific request (e.g., "GDPR Right to Erasure")</li>
            <li style={{ marginBottom: '8px' }}>We will verify your identity (may require additional proof) and respond within <strong>30 days</strong> (GDPR/CCPA standard)</li>
            <li style={{ marginBottom: '8px' }}>Requests are <strong>free of charge</strong> (first request); excessive/repetitive requests may incur reasonable administrative fees</li>
          </ol>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            9.4 Supervisory Authority Contact (GDPR Art. 77)
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            If you are in the EU/EEA/UK and believe we have violated your privacy rights, you may lodge a complaint with your
            local data protection authority:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', listStyle: 'disc' }}>
            <li><strong>EU/EEA:</strong> <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}>European Data Protection Board - Member List</a></li>
            <li><strong>UK:</strong> Information Commissioner's Office (ICO) - <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}>ico.org.uk</a></li>
          </ul>
        </section>

        {/* Section 10: Cookies and Tracking Technologies */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            10. Cookies and Tracking Technologies
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            We use cookies and similar tracking technologies (web beacons, pixels, local storage) to enhance user experience:
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            10.1 Essential Cookies (Strictly Necessary)
          </h3>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px', listStyle: 'disc' }}>
            <li>Authentication tokens (session management)</li>
            <li>Security tokens (CSRF protection)</li>
            <li>Load balancing cookies</li>
            <li><strong>Legal Basis:</strong> Contractual necessity (cannot be disabled)</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            10.2 Performance & Analytics Cookies (Consent Required)
          </h3>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px', listStyle: 'disc' }}>
            <li>Google Analytics 4 (anonymized IP, no cross-site tracking)</li>
            <li>Error tracking (Sentry.io session replays)</li>
            <li><strong>Legal Basis:</strong> Consent (GDPR Art. 6(1)(a))</li>
            <li><strong>Opt-Out:</strong> <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}>Google Analytics Opt-Out Browser Add-on</a></li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            10.3 Functional Cookies (Consent Required)
          </h3>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px', listStyle: 'disc' }}>
            <li>Theme preferences (dark/light mode)</li>
            <li>Language preferences</li>
            <li>Saved dashboard layouts</li>
          </ul>

          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            <strong>Cookie Management:</strong> You can manage cookies via browser settings. Disabling cookies may limit functionality.
          </p>
        </section>

        {/* Section 11: International Data Transfers */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            11. International Data Transfers (GDPR Chapter V)
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            Your data may be processed in the United States, European Union, or other jurisdictions where our service providers operate.
            For transfers from the EU/EEA to third countries, we use:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px', listStyle: 'disc' }}>
            <li><strong>EU Standard Contractual Clauses (SCCs):</strong> Commission Implementing Decision (EU) 2021/914 - Module 2 (Controller-to-Processor)</li>
            <li><strong>Adequacy Decisions:</strong> EU Commission adequacy decisions for specific countries (if applicable)</li>
            <li><strong>Supplementary Measures:</strong> Encryption, pseudonymization, access controls per Schrems II (CJEU C-311/18)</li>
            <li><strong>Service Provider Compliance:</strong> Vercel (EU data residency available), Supabase (EU Frankfurt region), Stripe (EU operations entity)</li>
          </ul>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            <strong>Request for SCC Copies:</strong> EU/EEA residents may request copies of SCCs by emailing <a href="mailto:dpo@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>dpo@vectorialdata.com</a>.
          </p>
        </section>

        {/* Section 12: Children's Privacy (COPPA Compliance) */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            12. Children's Privacy
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            Our Services are NOT intended for individuals under 18 years of age (or 16 in EU/EEA). We do not knowingly collect
            personal data from minors. If you are a parent/guardian and believe your child has provided us with personal information,
            contact <a href="mailto:privacy@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>privacy@vectorialdata.com</a> immediately.
            We will delete such data within 30 days of verification.
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            <strong>Compliance:</strong> Children's Online Privacy Protection Act (COPPA) - 15 U.S.C. §§ 6501–6506
          </p>
        </section>

        {/* Section 13: Changes to This Privacy Policy */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            13. Changes to This Privacy Policy
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            We may update this Privacy Policy to reflect changes in our practices, technology, legal requirements, or business operations.
            Material changes will be communicated via:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px', listStyle: 'disc' }}>
            <li>Email notification to registered users (at least 30 days prior to effective date)</li>
            <li>Prominent notice on our website homepage</li>
            <li>In-app notification for dashboard users</li>
            <li>Updated "Last Updated" date at top of this policy</li>
          </ul>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            <strong>Continued use after changes = acceptance.</strong> If you do not agree to changes, you must discontinue use
            and request account deletion.
          </p>
        </section>

        {/* Section 14: Contact Us */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            14. Contact Us
          </h2>
          <div style={{
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
              <strong>For privacy-related inquiries, data requests, or complaints:</strong>
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>Data Controller:</strong> Vectorial Data (Arcane Quants)
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>Privacy Officer:</strong> Data Protection Team
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>Email:</strong> <a href="mailto:privacy@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>privacy@vectorialdata.com</a>
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>DPO Email:</strong> <a href="mailto:dpo@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>dpo@vectorialdata.com</a>
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>Support:</strong> <a href="mailto:support@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>support@vectorialdata.com</a>
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
              <strong>Website:</strong> <a href="https://www.vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>www.vectorialdata.com</a>
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginTop: '16px' }}>
              <strong>Response Time:</strong> We will respond to all inquiries within 30 days (GDPR/CCPA standard).
            </p>
          </div>
        </section>

        {/* Footer */}
        <div style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '2px solid rgba(102, 126, 234, 0.3)',
          textAlign: 'center' as const
        }}>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '12px' }}>
            © 2025 Vectorial Data. All rights reserved.
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            <Link href="/terms" style={{ color: '#667eea', textDecoration: 'underline', marginRight: '16px' }}>
              Terms of Service
            </Link>
            <Link href="/" style={{ color: '#667eea', textDecoration: 'underline' }}>
              Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
