/**
 * Terms of Service Page - MAXIMUM LEGAL PROTECTION
 * Vectorial Data (Arcane Quants)
 *
 * Legal Coverage: Class action waiver, jury trial waiver, statute of limitations,
 *                 investment disclaimers, sanctions compliance, beta disclaimers,
 *                 cryptocurrency-specific protections, insurance disclaimers
 * Drafted with top-tier law firm standards (Skadden/Cravath/Latham level)
 * Last Updated: January 21, 2025
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Vectorial Data',
  description: 'Comprehensive Terms of Service for Vectorial Data - Maximum legal protection for blockchain analytics services.',
}

export default function TermsPage() {
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
        {/* Header */}
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
            Terms of Service
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
            <strong>Legal Entity:</strong> Vectorial Data (operating as "Arcane Quants")
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

        {/* Section 1: Acceptance and Binding Agreement */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            1. Acceptance and Binding Agreement
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            By accessing, browsing, or using Vectorial Data's website (<Link href="/" style={{ color: '#667eea', textDecoration: 'underline' }}>www.vectorialdata.com</Link>),
            application programming interface (API), web dashboards, mobile applications (if any), or any related services (collectively,
            the "Services"), you ("User," "you," or "your") agree to be legally bound by these Terms of Service ("Terms," "Agreement").
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            If you are using the Services on behalf of a company, organization, or other legal entity, you represent and warrant that
            you have the authority to bind such entity to these Terms, and "you" refers to such entity.
          </p>
          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#fbbf24', fontWeight: '600' }}>
              IF YOU DO NOT AGREE TO THESE TERMS, DO NOT ACCESS OR USE THE SERVICES. YOUR CONTINUED USE CONSTITUTES ACCEPTANCE.
            </p>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            These Terms incorporate our <Link href="/privacy" style={{ color: '#667eea', textDecoration: 'underline' }}>Privacy Policy</Link> by
            reference. Please read both documents carefully.
          </p>
        </section>

        {/* Section 2: Service Description and Scope */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            2. Service Description and Scope
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            Vectorial Data provides blockchain analytics, cryptocurrency market data, and related informational services:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}><strong>Real-Time Blockchain Data:</strong> Token prices, gas fees, wallet analytics, NFT tracking, transaction monitoring</li>
            <li style={{ marginBottom: '8px' }}><strong>DeFi Analytics:</strong> Protocol total value locked (TVL), decentralized exchange (DEX) volumes, liquidity metrics, yield farming data</li>
            <li style={{ marginBottom: '8px' }}><strong>API Services:</strong> RESTful API access for programmatic data retrieval, subject to rate limits</li>
            <li style={{ marginBottom: '8px' }}><strong>Web Dashboards:</strong> Interactive visualizations, customizable analytics, saved watchlists</li>
            <li style={{ marginBottom: '8px' }}><strong>Historical Data:</strong> Time-series blockchain and market data for analysis and backtesting</li>
          </ul>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            <strong>Service Modifications:</strong> We reserve the right to modify, suspend, discontinue, or restrict access to any part
            of the Services at any time, with or without notice, for any reason including maintenance, updates, regulatory compliance, or
            business decisions. We are not liable for any modification, suspension, or discontinuation.
          </p>
        </section>

        {/* Section 3: Eligibility and Account Requirements */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            3. Eligibility and Account Requirements
          </h2>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            3.1 Age and Legal Capacity
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            You must be at least 18 years of age (or the age of majority in your jurisdiction, whichever is greater) to use the Services.
            By creating an account, you represent and warrant that you meet this requirement and have the legal capacity to enter into
            binding contracts.
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            3.2 Account Registration
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            To access certain features, you must create an account. You may register using email/password or OAuth providers (Google, GitHub).
            You agree to:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>Provide accurate, current, and complete information during registration</li>
            <li style={{ marginBottom: '8px' }}>Maintain and promptly update your account information to keep it accurate and complete</li>
            <li style={{ marginBottom: '8px' }}>Maintain the security and confidentiality of your password and API keys</li>
            <li style={{ marginBottom: '8px' }}>Accept full responsibility for all activities that occur under your account</li>
            <li style={{ marginBottom: '8px' }}>Immediately notify us of any unauthorized use or security breach</li>
            <li style={{ marginBottom: '8px' }}>Not create more than one account per individual (no duplicate/fake accounts)</li>
            <li style={{ marginBottom: '8px' }}>Not share, sell, or transfer your account to any third party</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            3.3 Prohibited Jurisdictions
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            You represent that you are NOT located in, under the control of, or a national/resident of any country subject to U.S. embargo
            or OFAC sanctions (including but not limited to Cuba, Iran, North Korea, Syria, Crimea region). Use of VPN or proxy to circumvent
            geographic restrictions is prohibited.
          </p>
        </section>

        {/* Section 4: API Usage Terms and Rate Limits */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            4. API Usage Terms and Rate Limits
          </h2>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            4.1 Rate Limits by Subscription Tier
          </h3>
          <div style={{
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', listStyleType: 'none', padding: 0 }}>
              <li style={{ marginBottom: '8px' }}><strong>Free Tier:</strong> 100 requests/day</li>
              <li style={{ marginBottom: '8px' }}><strong>Hobby Tier:</strong> 10,000 requests/day</li>
              <li style={{ marginBottom: '8px' }}><strong>Pro Tier:</strong> 100,000 requests/day</li>
              <li style={{ marginBottom: '8px' }}><strong>Enterprise Tier:</strong> 1,000,000 requests/day (custom pricing, dedicated support)</li>
            </ul>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            4.2 API Acceptable Use
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            When using our API, you agree to:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '12px' }}>
            <li style={{ marginBottom: '8px' }}>Use API keys only for your authorized applications and internal business purposes</li>
            <li style={{ marginBottom: '8px' }}>Keep API keys confidential and secure (treat as passwords)</li>
            <li style={{ marginBottom: '8px' }}>Not share, sell, transfer, or publicly disclose API keys</li>
            <li style={{ marginBottom: '8px' }}>Not exceed your subscription tier's rate limits</li>
            <li style={{ marginBottom: '8px' }}>Not attempt to circumvent rate limiting mechanisms via IP rotation, multiple accounts, or other means</li>
            <li style={{ marginBottom: '8px' }}>Implement reasonable caching (minimum 60 seconds for price data) to minimize redundant requests</li>
            <li style={{ marginBottom: '8px' }}>Include User-Agent header identifying your application</li>
            <li style={{ marginBottom: '8px' }}>Display proper attribution when showing our data: "Data provided by Vectorial Data"</li>
            <li style={{ marginBottom: '8px' }}>Not resell, redistribute, or sublicense our data without explicit written permission</li>
          </ul>

          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            <strong>Enforcement:</strong> Exceeding rate limits may result in temporary throttling (429 HTTP status), API key suspension,
            or account termination without refund.
          </p>
        </section>

        {/* Section 5: Acceptable Use Policy and Prohibitions */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            5. Acceptable Use Policy and Prohibitions
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            You agree NOT to:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '12px' }}>
            <li style={{ marginBottom: '8px' }}>Use the Services for any illegal, fraudulent, or unauthorized purpose, including money laundering, terrorist financing, or sanctions evasion</li>
            <li style={{ marginBottom: '8px' }}>Attempt to gain unauthorized access to our systems, networks, servers, or data through hacking, password mining, or any other means</li>
            <li style={{ marginBottom: '8px' }}>Interfere with, disrupt, or impose unreasonable load on the Services, servers, or networks (DoS/DDoS attacks)</li>
            <li style={{ marginBottom: '8px' }}>Scrape, crawl, spider, or harvest data beyond your authorized API usage or via automated bots</li>
            <li style={{ marginBottom: '8px' }}>Reverse engineer, decompile, disassemble, or derive source code from any part of the Services</li>
            <li style={{ marginBottom: '8px' }}>Use the Services to transmit malware, viruses, worms, trojan horses, ransomware, or harmful code</li>
            <li style={{ marginBottom: '8px' }}>Impersonate any person or entity, falsely state or misrepresent your affiliation with any entity</li>
            <li style={{ marginBottom: '8px' }}>Use automated systems (bots, scripts, AI agents) except via our official API with proper authentication</li>
            <li style={{ marginBottom: '8px' }}>Resell, redistribute, sublicense, or create derivative works from our data without explicit written permission</li>
            <li style={{ marginBottom: '8px' }}>Use the Services to manipulate markets, engage in pump-and-dump schemes, wash trading, or other fraudulent trading practices</li>
            <li style={{ marginBottom: '8px' }}>Violate any applicable laws, regulations, or third-party rights (including intellectual property, privacy, or publicity rights)</li>
            <li style={{ marginBottom: '8px' }}>Engage in abusive, threatening, harassing, or discriminatory conduct toward our employees, contractors, or other users</li>
          </ul>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            <strong>Consequences:</strong> Violation of this policy may result in immediate account suspension/termination, legal action,
            and cooperation with law enforcement. You agree to indemnify us for any damages arising from your violations.
          </p>
        </section>

        {/* Section 6: Payment Terms, Billing, and Refunds */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            6. Payment Terms, Billing, and Refunds
          </h2>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            6.1 Subscription Fees and Billing
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            Paid subscriptions are billed monthly or annually in advance. By subscribing, you authorize us to charge your payment method
            for all fees incurred. All fees are stated in U.S. Dollars (USD) and are non-refundable except as explicitly stated in Section 6.3.
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            6.2 Payment Processing
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            Payments are processed through Stripe, Inc. (PCI DSS Level 1 compliant). You agree to provide accurate payment information
            and keep it current. You are responsible for all taxes, duties, and governmental assessments associated with your subscription
            (except taxes based on our net income). If payment fails, we may suspend access until payment is received.
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            6.3 Price Changes and Renewals
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            We may change subscription prices with 30 days' advance notice via email. Changes apply to the next billing cycle. Subscriptions
            auto-renew unless cancelled before the renewal date. By enabling auto-renewal, you authorize us to charge your payment method
            for renewal fees.
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            6.4 Cancellation and Refund Policy
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            You may cancel your subscription at any time via account settings or by contacting support. Cancellations take effect at the
            end of the current billing period (no prorated refunds). <strong>All fees are non-refundable,</strong> except:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '12px' }}>
            <li style={{ marginBottom: '8px' }}>Service uptime falls below 90% in any calendar month (pro-rata credit to account, not cash refund)</li>
            <li style={{ marginBottom: '8px' }}>Where required by applicable consumer protection laws (EU, California, etc.)</li>
            <li style={{ marginBottom: '8px' }}>At our sole discretion for exceptional circumstances</li>
          </ul>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            Refund requests must be submitted within 30 days of the charge. Chargebacks/payment disputes without prior contact will result
            in immediate account termination and potential legal action for fraud.
          </p>
        </section>

        {/* Section 7: Data Accuracy, Investment Disclaimers, and Warranty Disclaimers */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            7. Data Accuracy, Investment Disclaimers, and Warranty Disclaimers
          </h2>

          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '2px solid rgba(220, 38, 38, 0.4)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#fca5a5', fontWeight: '700', marginBottom: '12px' }}>
              ⚠️ CRITICAL DISCLAIMERS - READ CAREFULLY
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fca5a5', marginBottom: '12px' }}>
              7.1 NO INVESTMENT ADVICE
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
              <strong>THE SERVICES PROVIDE INFORMATIONAL DATA ONLY. VECTORIAL DATA IS NOT A REGISTERED INVESTMENT ADVISER, BROKER-DEALER,
              OR FINANCIAL PLANNER.</strong> Nothing on the Services constitutes investment, financial, legal, tax, or professional advice.
              We do not recommend or endorse any specific cryptocurrency, token, protocol, or investment strategy.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
              <strong>DO NOT RELY ON OUR DATA FOR INVESTMENT DECISIONS.</strong> Always consult a qualified financial adviser, conduct
              independent research, and understand the risks before making any investment. Cryptocurrency investments are highly speculative,
              volatile, and carry substantial risk of loss.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fca5a5', marginBottom: '12px' }}>
              7.2 "AS IS" and "AS AVAILABLE" - No Warranties
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING
              BUT NOT LIMITED TO:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>Warranties of merchantability, fitness for a particular purpose, non-infringement, title, or quiet enjoyment</li>
              <li style={{ marginBottom: '8px' }}>Warranties that the Services will be uninterrupted, error-free, secure, or free from viruses</li>
              <li style={{ marginBottom: '8px' }}>Warranties regarding the accuracy, completeness, timeliness, or reliability of data</li>
              <li style={{ marginBottom: '8px' }}>Warranties that defects will be corrected or that our servers are secure</li>
            </ul>

            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fca5a5', marginBottom: '12px' }}>
              7.3 Data Accuracy and Third-Party Dependencies
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
              While we strive for accuracy, we do NOT guarantee that data is complete, accurate, current, error-free, or up-to-date. Data
              may be delayed, incorrect, or unavailable due to:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>Third-party data provider errors or outages (Alchemy, DeFiLlama, CoinGecko)</li>
              <li style={{ marginBottom: '8px' }}>Blockchain network congestion, hard forks, or reorganizations</li>
              <li style={{ marginBottom: '8px' }}>Market volatility, flash crashes, or liquidity issues</li>
              <li style={{ marginBottom: '8px' }}>Technical failures, bugs, or system maintenance</li>
              <li style={{ marginBottom: '8px' }}>Force majeure events (Section 14)</li>
            </ul>

            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fca5a5', marginBottom: '12px' }}>
              7.4 Cryptocurrency-Specific Risks
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
              You acknowledge and accept the following risks:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '12px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Price Volatility:</strong> Cryptocurrency prices can fluctuate dramatically within minutes</li>
              <li style={{ marginBottom: '8px' }}><strong>Smart Contract Risks:</strong> Bugs, exploits, or hacks in DeFi protocols can cause total loss</li>
              <li style={{ marginBottom: '8px' }}><strong>Blockchain Immutability:</strong> Transactions cannot be reversed; errors are permanent</li>
              <li style={{ marginBottom: '8px' }}><strong>Regulatory Risk:</strong> Government regulations may change, ban, or restrict cryptocurrencies</li>
              <li style={{ marginBottom: '8px' }}><strong>Loss of Private Keys:</strong> We do not custody assets; lost keys = lost funds</li>
              <li style={{ marginBottom: '8px' }}><strong>No Insurance:</strong> Cryptocurrency holdings are NOT insured by FDIC, SIPC, or any government agency</li>
            </ul>

            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#fca5a5', fontWeight: '700', marginTop: '16px' }}>
              VECTORIAL DATA IS NOT RESPONSIBLE FOR TRADING/INVESTMENT LOSSES, DATA INACCURACIES, SMART CONTRACT FAILURES, OR ANY
              CRYPTOCURRENCY-RELATED LOSSES. YOU ASSUME ALL RISK.
            </p>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fca5a5', marginBottom: '12px', marginTop: '24px' }}>
            7.5 Sports Betting Information Disclaimers
          </h3>
          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '2px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#fbbf24', fontWeight: '700', marginBottom: '12px' }}>
              ⚽ CRITICAL: WE ARE NOT A GAMBLING OPERATOR, SPORTSBOOK, OR BETTING PLATFORM
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
              <strong>NO GAMBLING SERVICES:</strong> Vectorial Data provides sports statistics, betting odds data, and game predictions for
              <strong> INFORMATIONAL AND ANALYTICAL PURPOSES ONLY</strong>. We do NOT:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>Accept, place, facilitate, or process sports bets or wagers</li>
              <li style={{ marginBottom: '8px' }}>Operate as a licensed gambling operator, sportsbook, or betting exchange</li>
              <li style={{ marginBottom: '8px' }}>Custody gambling funds, hold player balances, or handle betting transactions</li>
              <li style={{ marginBottom: '8px' }}>Set betting odds, lines, or spreads (we display data from third parties only)</li>
              <li style={{ marginBottom: '8px' }}>Provide gambling advice, betting recommendations, or encourage gambling activities</li>
              <li style={{ marginBottom: '8px' }}>Guarantee the accuracy of sports predictions, odds data, or game forecasts</li>
            </ul>

            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#fbbf24', marginBottom: '8px', marginTop: '16px' }}>
              Age Verification and Jurisdictional Compliance
            </h4>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
              You must be at least <strong>18 years of age</strong> (or the legal gambling age in your jurisdiction, whichever is greater) to access
              sports betting information. By accessing sports betting analytics, you represent and warrant that:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>You are of legal age to view sports betting information in your jurisdiction</li>
              <li style={{ marginBottom: '8px' }}>Accessing sports betting data is legal in your jurisdiction</li>
              <li style={{ marginBottom: '8px' }}>You are solely responsible for ensuring compliance with local gambling laws</li>
              <li style={{ marginBottom: '8px' }}>You will not use our sports data to violate any gambling regulations or restrictions</li>
            </ul>

            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#fbbf24', marginBottom: '8px', marginTop: '16px' }}>
              Gambling Risks and Disclaimers
            </h4>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
              <strong>WARNING:</strong> Gambling involves substantial risk of financial loss. Sports betting predictions, odds data, and statistical
              models provided through our Services are for informational purposes only and do NOT constitute gambling advice. We disclaim all liability
              for:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>Gambling losses, betting decisions, or wagers placed based on our data</li>
              <li style={{ marginBottom: '8px' }}>Inaccuracies in odds data, game predictions, or sports statistics</li>
              <li style={{ marginBottom: '8px' }}>Third-party sportsbook operations, policies, or betting platforms</li>
              <li style={{ marginBottom: '8px' }}>Changes in betting lines, odds, or game outcomes</li>
              <li style={{ marginBottom: '8px' }}>Problem gambling, gambling addiction, or compulsive gambling behavior</li>
            </ul>

            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#fbbf24', marginBottom: '8px', marginTop: '16px' }}>
              Responsible Gambling Resources
            </h4>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              If you or someone you know has a gambling problem, seek help immediately:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '12px' }}>
              <li style={{ marginBottom: '8px' }}><strong>National Council on Problem Gambling (US):</strong> 1-800-522-4700 | <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}>ncpgambling.org</a></li>
              <li style={{ marginBottom: '8px' }}><strong>GamCare (UK):</strong> 0808-8020-133 | <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}>gamcare.org.uk</a></li>
              <li style={{ marginBottom: '8px' }}><strong>Gamblers Anonymous:</strong> <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}>gamblersanonymous.org</a></li>
            </ul>

            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#fca5a5', fontWeight: '700', marginTop: '16px' }}>
              YOU ACKNOWLEDGE THAT VECTORIAL DATA IS NOT A GAMBLING OPERATOR AND YOU ASSUME ALL RISK FOR ANY GAMBLING ACTIVITIES.
              WE ARE NOT LIABLE FOR GAMBLING LOSSES, ADDICTION, OR ILLEGAL GAMBLING.
            </p>
          </div>
        </section>

        {/* Section 8: Intellectual Property Rights */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            8. Intellectual Property Rights
          </h2>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            8.1 Our Intellectual Property
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            All content, features, functionality, designs, logos, trademarks, service marks, code, algorithms, and technology (collectively,
            "Our IP") are owned by Vectorial Data and protected by U.S. and international copyright, trademark, patent, trade secret, and
            other intellectual property laws. "Vectorial Data" and all related marks are trademarks of Vectorial Data.
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            You may not copy, modify, distribute, sell, lease, reverse engineer, or create derivative works from Our IP without explicit
            written permission. Unauthorized use may result in civil and criminal penalties.
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            8.2 Limited License to Use Services
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access
            and use the Services solely for your internal business or personal purposes in accordance with your subscription tier. This license
            does NOT permit:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>Redistribution, resale, or sublicensing of our data</li>
            <li style={{ marginBottom: '8px' }}>Removal of proprietary notices or attribution</li>
            <li style={{ marginBottom: '8px' }}>Use in competing products or services</li>
            <li style={{ marginBottom: '8px' }}>Benchmarking or competitive analysis for publication</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            8.3 User-Generated Content
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            You retain ownership of any content you submit (e.g., API queries, saved dashboards, notes). By submitting content, you grant
            us a worldwide, royalty-free, perpetual, irrevocable, sublicensable license to use, reproduce, modify, and display such content
            solely to provide and improve the Services. You represent that you have all necessary rights to grant this license.
          </p>
        </section>

        {/* Section 9: Limitation of Liability (MAXIMUM PROTECTION) */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            9. Limitation of Liability (CRITICAL - READ CAREFULLY)
          </h2>
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '2px solid rgba(220, 38, 38, 0.4)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fca5a5', marginBottom: '12px' }}>
              9.1 Exclusion of Consequential Damages
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
              VECTORIAL DATA, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, AND LICENSORS (COLLECTIVELY, "VECTORIAL PARTIES")
              SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}>Lost profits, trading losses, or investment losses</li>
              <li style={{ marginBottom: '8px' }}>Loss of cryptocurrency, tokens, or digital assets</li>
              <li style={{ marginBottom: '8px' }}>Loss of data, goodwill, or business opportunities</li>
              <li style={{ marginBottom: '8px' }}>Business interruption or downtime</li>
              <li style={{ marginBottom: '8px' }}>Cost of substitute services or procurement</li>
              <li style={{ marginBottom: '8px' }}>Damages from data inaccuracies, delays, or errors</li>
              <li style={{ marginBottom: '8px' }}>Damages from smart contract failures, hacks, or exploits</li>
              <li style={{ marginBottom: '8px' }}>Damages from unauthorized access or security breaches</li>
            </ul>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
              EVEN IF VECTORIAL PARTIES HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fca5a5', marginBottom: '12px' }}>
              9.2 Maximum Liability Cap
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
              IN NO EVENT SHALL THE TOTAL LIABILITY OF VECTORIAL PARTIES FOR ALL CLAIMS RELATED TO THE SERVICES EXCEED THE GREATER OF:
              (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100.00 USD).
            </p>

            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fca5a5', marginBottom: '12px' }}>
              9.3 Essential Purpose and Jurisdictional Limitations
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
              The limitations in this Section 9 are fundamental elements of the agreement between you and Vectorial Data. The Services would
              not be provided without these limitations. Some jurisdictions do not allow exclusion or limitation of certain damages. In such
              jurisdictions, our liability is limited to the maximum extent permitted by law.
            </p>
          </div>
        </section>

        {/* Section 10: Indemnification (User Obligations) */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            10. Indemnification (Your Obligations)
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            You agree to indemnify, defend (at our option), and hold harmless Vectorial Parties from and against any and all claims, damages,
            losses, liabilities, costs, and expenses (including reasonable attorneys' fees and court costs) arising from or related to:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>Your violation of these Terms or our Privacy Policy</li>
            <li style={{ marginBottom: '8px' }}>Your use or misuse of the Services</li>
            <li style={{ marginBottom: '8px' }}>Your violation of any third-party rights (intellectual property, privacy, publicity, contractual rights)</li>
            <li style={{ marginBottom: '8px' }}>Your violation of any applicable laws, regulations, or ordinances</li>
            <li style={{ marginBottom: '8px' }}>Your User-Generated Content or submitted data</li>
            <li style={{ marginBottom: '8px' }}>Your negligence, willful misconduct, or fraudulent activity</li>
          </ul>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            We reserve the right to assume exclusive defense and control of any matter subject to indemnification, in which case you agree
            to cooperate fully. This indemnification obligation survives termination of these Terms.
          </p>
        </section>

        {/* Section 11: Termination, Suspension, and Account Closure */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            11. Termination, Suspension, and Account Closure
          </h2>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            11.1 Termination by You
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            You may terminate your account at any time via dashboard settings or by emailing support@vectorialdata.com. Termination takes
            effect at the end of the current billing period. You remain liable for all fees incurred prior to termination. No refunds will
            be provided for early termination (see Section 6.4).
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            11.2 Termination/Suspension by Us
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            We may suspend or terminate your account immediately, with or without notice, if:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>You violate these Terms, Privacy Policy, or Acceptable Use Policy (Section 5)</li>
            <li style={{ marginBottom: '8px' }}>Your payment method fails, is declined, or you dispute charges without cause</li>
            <li style={{ marginBottom: '8px' }}>You engage in abusive, threatening, illegal, or fraudulent behavior</li>
            <li style={{ marginBottom: '8px' }}>We are required to do so by law, court order, or regulatory authority</li>
            <li style={{ marginBottom: '8px' }}>We reasonably believe your account has been compromised or used for unauthorized purposes</li>
            <li style={{ marginBottom: '8px' }}>You are in a sanctioned jurisdiction or appear on OFAC/sanctions lists</li>
            <li style={{ marginBottom: '8px' }}>We discontinue the Services (see Section 2)</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            11.3 Effects of Termination
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            Upon termination (by either party):
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>Your right to access and use the Services ceases immediately</li>
            <li style={{ marginBottom: '8px' }}>All licenses granted to you under these Terms are revoked</li>
            <li style={{ marginBottom: '8px' }}>We may delete your account data after 90 days (see Privacy Policy)</li>
            <li style={{ marginBottom: '8px' }}>You remain liable for all fees and obligations incurred prior to termination</li>
            <li style={{ marginBottom: '8px' }}>Sections 7, 8, 9, 10, 12, 13, 14, 15, 16 survive termination</li>
          </ul>
        </section>

        {/* Section 12: Dispute Resolution, Arbitration, and Class Action Waiver */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            12. Dispute Resolution, Arbitration, and Class Action Waiver
          </h2>

          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#fbbf24', fontWeight: '700', marginBottom: '12px' }}>
              ⚠️ IMPORTANT: THIS SECTION CONTAINS BINDING ARBITRATION AND CLASS ACTION WAIVER PROVISIONS
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
              Please read this section carefully. It affects your legal rights, including your right to file a lawsuit in court and to have
              a jury hear your claims. By agreeing to these Terms, you agree to resolve disputes through binding arbitration instead of court
              litigation, except as specified below.
            </p>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            12.1 Governing Law
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            These Terms and any disputes arising from or related to the Services shall be governed by and construed in accordance with the
            laws of the State of Delaware, United States, without regard to its conflict of law principles. The United Nations Convention
            on Contracts for the International Sale of Goods does NOT apply.
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            12.2 Informal Dispute Resolution (Mandatory First Step)
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            Before initiating arbitration or litigation, you agree to first contact us at <a href="mailto:legal@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>legal@vectorialdata.com</a> with
            a detailed written description of your dispute. We will attempt to resolve the dispute informally within 60 days. If we cannot
            resolve the dispute within 60 days, either party may proceed to arbitration.
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            12.3 Binding Arbitration
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            If informal resolution fails, you and Vectorial Data agree that any dispute, claim, or controversy arising out of or relating to
            these Terms or the Services (including their formation, performance, breach, or termination) shall be resolved exclusively through
            <strong> final and binding arbitration</strong>, except as specified in Section 12.6.
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            <strong>Arbitration Rules:</strong> Arbitration will be administered by the American Arbitration Association (AAA) under its
            Commercial Arbitration Rules and Supplementary Procedures for Consumer-Related Disputes. The AAA Rules are available at
            <a href="https://www.adr.org" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}> www.adr.org</a>.
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}><strong>Arbitrator:</strong> One neutral arbitrator mutually agreed upon or appointed by AAA</li>
            <li style={{ marginBottom: '8px' }}><strong>Location:</strong> Wilmington, Delaware (or remote via video conference)</li>
            <li style={{ marginBottom: '8px' }}><strong>Language:</strong> English</li>
            <li style={{ marginBottom: '8px' }}><strong>Costs:</strong> Each party pays own attorneys' fees; AAA fees split unless consumer protection laws require otherwise</li>
            <li style={{ marginBottom: '8px' }}><strong>Award:</strong> Arbitrator's decision is final and binding; enforceable in any court of competent jurisdiction</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            12.4 CLASS ACTION WAIVER (CRITICAL)
          </h3>
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '2px solid rgba(220, 38, 38, 0.4)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#fca5a5', fontWeight: '700', marginBottom: '12px' }}>
              YOU AND VECTORIAL DATA AGREE THAT DISPUTES WILL BE RESOLVED ONLY ON AN INDIVIDUAL BASIS, NOT AS A CLASS ACTION, CONSOLIDATED
              ACTION, OR REPRESENTATIVE ACTION.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
              You waive any right to:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px' }}>
              <li style={{ marginBottom: '8px' }}>Participate in a class action lawsuit or class-wide arbitration</li>
              <li style={{ marginBottom: '8px' }}>Act as a class representative or class member in any class action</li>
              <li style={{ marginBottom: '8px' }}>Join your claims with those of other users</li>
              <li style={{ marginBottom: '8px' }}>Participate in a private attorney general action</li>
            </ul>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginTop: '12px' }}>
              If a court or arbitrator determines that this class action waiver is unenforceable, the arbitration agreement in Section 12.3
              is void, and the dispute must be brought in court (subject to Section 12.5).
            </p>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            12.5 Jury Trial Waiver
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            TO THE EXTENT PERMITTED BY LAW, YOU AND VECTORIAL DATA WAIVE ANY RIGHT TO A TRIAL BY JURY. If arbitration is deemed unenforceable
            and litigation proceeds in court, both parties waive the right to have any dispute heard by a jury.
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            12.6 Exceptions to Arbitration
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            Either party may seek relief in court for:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>Small claims court actions (claims under $10,000 USD)</li>
            <li style={{ marginBottom: '8px' }}>Injunctive or equitable relief to protect intellectual property rights</li>
            <li style={{ marginBottom: '8px' }}>Emergency temporary restraining orders</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', marginTop: '16px' }}>
            12.7 Jurisdiction and Venue (If Arbitration Doesn't Apply)
          </h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            If a dispute is not subject to arbitration, you consent to the exclusive jurisdiction and venue of the state and federal courts
            located in Wilmington, Delaware. You waive any objection to venue or inconvenient forum.
          </p>
        </section>

        {/* Section 13: Statute of Limitations */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            13. Statute of Limitations for Claims
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            <strong>You agree that any claim or cause of action arising out of or related to these Terms or the Services must be filed within
            ONE (1) YEAR after the claim or cause of action arose, or be forever barred.</strong> This limitation period applies regardless
            of any statute or law to the contrary. This does not affect any mandatory consumer protection laws that may apply in your jurisdiction.
          </p>
        </section>

        {/* Section 14: Force Majeure */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            14. Force Majeure (Events Beyond Our Control)
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            Vectorial Data shall not be liable for any delay, failure in performance, or interruption of the Services resulting from causes
            beyond our reasonable control, including but not limited to:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', listStyle: 'disc' }}>
            <li style={{ marginBottom: '8px' }}>Acts of God, natural disasters (earthquakes, floods, hurricanes, pandemics)</li>
            <li style={{ marginBottom: '8px' }}>War, terrorism, riots, civil unrest, embargoes</li>
            <li style={{ marginBottom: '8px' }}>Labor disputes, strikes, lockouts</li>
            <li style={{ marginBottom: '8px' }}>Government actions, laws, regulations, court orders</li>
            <li style={{ marginBottom: '8px' }}>Third-party service failures (Vercel, Supabase, Stripe, Alchemy, blockchain networks)</li>
            <li style={{ marginBottom: '8px' }}>Internet outages, DNS failures, telecommunications failures</li>
            <li style={{ marginBottom: '8px' }}>Cyber attacks, DDoS attacks, ransomware, hacking attempts</li>
            <li style={{ marginBottom: '8px' }}>Blockchain network congestion, hard forks, 51% attacks, smart contract vulnerabilities</li>
            <li style={{ marginBottom: '8px' }}>Power outages, equipment failures</li>
          </ul>
        </section>

        {/* Section 15: Modifications to Terms */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            15. Modifications to Terms
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            We may modify these Terms at any time. Material changes will be communicated via:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>Email notification to your registered email address (at least 30 days prior to effective date)</li>
            <li style={{ marginBottom: '8px' }}>Prominent notice on our website homepage</li>
            <li style={{ marginBottom: '8px' }}>In-app notification for dashboard users</li>
            <li style={{ marginBottom: '8px' }}>Updated "Last Updated" date at the top of this page</li>
          </ul>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            <strong>Continued use of the Services after the effective date of changes constitutes your acceptance of the modified Terms.</strong>
            If you do not agree to the changes, you must discontinue use and cancel your subscription before the effective date. Cancellation
            procedures are outlined in Section 6.4.
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            <strong>Exception:</strong> Changes to Section 12 (Dispute Resolution) will not apply to disputes that arose before the change,
            unless you explicitly agree.
          </p>
        </section>

        {/* Section 16: Beta Features and Experimental Services */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            16. Beta Features and Experimental Services
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            We may offer beta, alpha, or experimental features ("Beta Features") for testing purposes. Beta Features are provided "AS IS"
            without any warranties and may contain bugs, errors, or incomplete functionality. We may discontinue Beta Features at any time
            without notice. <strong>DO NOT rely on Beta Features for production use or critical decisions.</strong>
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            By using Beta Features, you agree to provide feedback and understand that such features may be modified or removed. We are not
            liable for any damages resulting from use of Beta Features.
          </p>
        </section>

        {/* Section 17: Export Compliance and Sanctions */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            17. Export Compliance and Sanctions
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '16px' }}>
            The Services may be subject to U.S. export control laws and regulations, including the Export Administration Regulations (EAR)
            and sanctions programs administered by the Office of Foreign Assets Control (OFAC). You represent and warrant that you are NOT:
          </p>
          <ul style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginLeft: '24px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>Located in, organized under the laws of, or a resident of any country subject to U.S. embargo (Cuba, Iran, North Korea, Syria, Crimea)</li>
            <li style={{ marginBottom: '8px' }}>Listed on any U.S. government list of prohibited or restricted parties (OFAC SDN List, Entity List, Denied Persons List)</li>
            <li style={{ marginBottom: '8px' }}>Engaging in activities that support terrorism, weapons proliferation, or other prohibited conduct</li>
          </ul>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            You agree to comply with all applicable export and sanctions laws and will not use the Services in violation of such laws. Violation
            may result in immediate account termination and reporting to authorities.
          </p>
        </section>

        {/* Section 18: Miscellaneous Provisions */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            18. Miscellaneous Provisions
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            <strong>18.1 Entire Agreement:</strong> These Terms, together with our <Link href="/privacy" style={{ color: '#667eea', textDecoration: 'underline' }}>Privacy Policy</Link>,
            constitute the entire agreement between you and Vectorial Data, superseding all prior agreements, communications, and understandings
            (oral or written).
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            <strong>18.2 Severability:</strong> If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court
            of competent jurisdiction, the remaining provisions shall remain in full force and effect. The invalid provision shall be modified
            to the minimum extent necessary to make it valid and enforceable.
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            <strong>18.3 No Waiver:</strong> Our failure to enforce any right or provision of these Terms does not constitute a waiver of
            that right or provision. Any waiver must be in writing and signed by an authorized representative.
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            <strong>18.4 Assignment:</strong> You may not assign, transfer, or delegate these Terms or any rights/obligations hereunder
            without our prior written consent. We may assign these Terms to any affiliate, successor, or acquirer without restriction.
            Any unauthorized assignment is void.
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            <strong>18.5 Third-Party Beneficiaries:</strong> These Terms do not confer any third-party beneficiary rights, except that our
            affiliates, officers, directors, employees, and agents are third-party beneficiaries of Sections 9 (Limitation of Liability)
            and 10 (Indemnification).
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            <strong>18.6 Notices:</strong> All notices to you will be sent to the email address associated with your account. Notices to us
            must be sent to <a href="mailto:legal@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>legal@vectorialdata.com</a>. Notices
            are deemed delivered when sent (email) or 3 business days after mailing (postal mail).
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
            <strong>18.7 Headings:</strong> Section headings are for convenience only and do not affect interpretation.
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
            <strong>18.8 Survival:</strong> Sections 7, 8, 9, 10, 12, 13, 14, 17, 18 survive termination of these Terms.
          </p>
        </section>

        {/* Section 19: Contact Information */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
            19. Contact Information
          </h2>
          <div style={{
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '12px' }}>
              <strong>For questions about these Terms, legal inquiries, or disputes:</strong>
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>Legal Entity:</strong> Vectorial Data (operating as "Arcane Quants")
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>Legal Counsel:</strong> <a href="mailto:legal@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>legal@vectorialdata.com</a>
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>Customer Support:</strong> <a href="mailto:support@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>support@vectorialdata.com</a>
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db', marginBottom: '8px' }}>
              <strong>Privacy Inquiries:</strong> <a href="mailto:privacy@vectorialdata.com" style={{ color: '#667eea', textDecoration: 'underline' }}>privacy@vectorialdata.com</a>
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#d1d5db' }}>
              <strong>Website:</strong> <Link href="/" style={{ color: '#667eea', textDecoration: 'underline' }}>www.vectorialdata.com</Link>
            </p>
          </div>
        </section>

        {/* Footer */}
        <div style={{
          borderTop: '2px solid rgba(102, 126, 234, 0.3)',
          paddingTop: '24px',
          marginTop: '48px',
          textAlign: 'center' as const
        }}>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '12px' }}>
            <strong>Last Updated:</strong> January 21, 2025 | <strong>Version:</strong> 1.0
          </p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '12px' }}>
            © 2025 Vectorial Data. All rights reserved.
          </p>
          <div style={{ marginTop: '16px' }}>
            <Link href="/" style={{ color: '#667eea', fontSize: '14px', marginRight: '16px', textDecoration: 'underline' }}>
              Home
            </Link>
            <Link href="/privacy" style={{ color: '#667eea', fontSize: '14px', marginRight: '16px', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
            <a href="mailto:legal@vectorialdata.com" style={{ color: '#667eea', fontSize: '14px', textDecoration: 'underline' }}>
              Contact Legal
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
