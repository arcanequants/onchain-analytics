/**
 * Pricing Page
 *
 * Displays pricing plans and allows users to subscribe
 *
 * Phase 2, Week 5, Day 4
 */

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PricingCard, BillingToggle } from '@/components/billing/PricingCard';
import { PLANS, type PlanId } from '@/lib/stripe/config';
import { startCheckout } from '@/lib/stripe/client-side';

// ================================================================
// FAQ DATA
// ================================================================

const faqs = [
  {
    question: 'What AI providers do you analyze?',
    answer:
      'We analyze responses from OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), and Perplexity. Our Pro plan includes all 4 providers for comprehensive AI perception coverage.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes! You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period.',
  },
  {
    question: 'What happens when I reach my analysis limit?',
    answer:
      "When you reach your monthly analysis limit, you can upgrade to a higher plan for more analyses. Your limit resets at the beginning of each billing cycle.",
  },
  {
    question: 'Do you offer refunds?',
    answer:
      "We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied, contact us within 14 days of your purchase for a full refund.",
  },
  {
    question: 'What is AI Perception Score?',
    answer:
      'Your AI Perception Score (0-100) measures how well AI assistants know and recommend your brand. A higher score means AIs are more likely to suggest your products or services to users.',
  },
  {
    question: 'How often is my score updated?',
    answer:
      'Free users can manually re-analyze. Starter users get weekly automated monitoring, and Pro users get daily monitoring with instant alerts for score changes.',
  },
];

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function PricingPage() {
  const searchParams = useSearchParams();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for checkout status
  const checkoutStatus = searchParams.get('checkout');
  const isCanceled = checkoutStatus === 'canceled';

  // TODO: Get current user's plan from session/database
  const currentPlan: PlanId = 'free';

  const handleSelectPlan = async (planId: string, annual: boolean) => {
    if (planId === 'free') {
      // Free plan doesn't need checkout
      window.location.href = '/dashboard';
      return;
    }

    setLoadingPlan(planId);
    setError(null);

    try {
      const plan = PLANS[planId as PlanId];
      const priceId = annual ? plan.stripePriceIdAnnual : plan.stripePriceId;

      if (!priceId) {
        setError('Pricing not configured. Please contact support.');
        setLoadingPlan(null);
        return;
      }

      const result = await startCheckout(priceId);

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Start free, upgrade when you're ready.
          </p>

          {/* Checkout canceled message */}
          {isCanceled && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-md mx-auto">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                Checkout was canceled. Feel free to try again when you're ready.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md mx-auto">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BillingToggle isAnnual={isAnnual} onChange={setIsAnnual} />
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {Object.values(PLANS).map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isAnnual={isAnnual}
              isCurrentPlan={plan.id === currentPlan}
              isLoading={loadingPlan === plan.id}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Compare Plans
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-4 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Feature
                  </th>
                  {Object.values(PLANS).map((plan) => (
                    <th
                      key={plan.id}
                      className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white text-center"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    Analyses per month
                  </td>
                  {Object.values(PLANS).map((plan) => (
                    <td
                      key={plan.id}
                      className="py-4 px-4 text-sm text-gray-900 dark:text-white text-center"
                    >
                      {plan.limits.analysesPerMonth}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    AI Providers
                  </td>
                  {Object.values(PLANS).map((plan) => (
                    <td
                      key={plan.id}
                      className="py-4 px-4 text-sm text-gray-900 dark:text-white text-center"
                    >
                      {plan.limits.aiProviders}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    Competitor Tracking
                  </td>
                  {Object.values(PLANS).map((plan) => (
                    <td
                      key={plan.id}
                      className="py-4 px-4 text-sm text-gray-900 dark:text-white text-center"
                    >
                      {plan.limits.competitors || '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    Monitoring
                  </td>
                  {Object.values(PLANS).map((plan) => (
                    <td
                      key={plan.id}
                      className="py-4 px-4 text-sm text-gray-900 dark:text-white text-center capitalize"
                    >
                      {plan.limits.monitoringFrequency === 'none'
                        ? '—'
                        : plan.limits.monitoringFrequency}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    History Retention
                  </td>
                  {Object.values(PLANS).map((plan) => (
                    <td
                      key={plan.id}
                      className="py-4 px-4 text-sm text-gray-900 dark:text-white text-center"
                    >
                      {plan.limits.historyDays} days
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    Export Formats
                  </td>
                  {Object.values(PLANS).map((plan) => (
                    <td
                      key={plan.id}
                      className="py-4 px-4 text-sm text-gray-900 dark:text-white text-center uppercase"
                    >
                      {plan.limits.exportFormats.join(', ') || '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    Priority Support
                  </td>
                  {Object.values(PLANS).map((plan) => (
                    <td
                      key={plan.id}
                      className="py-4 px-4 text-sm text-center"
                    >
                      {plan.limits.prioritySupport ? (
                        <span className="text-green-500">Yes</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    API Access
                  </td>
                  {Object.values(PLANS).map((plan) => (
                    <td
                      key={plan.id}
                      className="py-4 px-4 text-sm text-center"
                    >
                      {plan.limits.apiAccess ? (
                        <span className="text-green-500">Yes</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to improve your AI perception?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Start with our free plan and upgrade when you need more power.
          </p>
          <button
            onClick={() => handleSelectPlan('free', false)}
            className="inline-flex items-center px-8 py-3 rounded-lg bg-white text-blue-600 font-medium hover:bg-blue-50 transition-colors"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </div>
  );
}
