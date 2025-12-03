/**
 * Billing Success Page
 *
 * Celebration page after successful subscription upgrade
 *
 * Phase 2, Week 5, Day 5
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PLANS, type PlanId } from '@/lib/stripe/config';

// ================================================================
// CONFETTI COMPONENT (INLINE FOR CELEBRATION)
// ================================================================

function ConfettiPiece({ delay, left }: { delay: number; left: number }) {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-purple-500',
    'bg-indigo-500',
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomRotation = Math.random() * 360;
  const randomSize = 8 + Math.random() * 8;

  return (
    <div
      className={`absolute ${randomColor} rounded-sm animate-confetti-fall`}
      style={{
        left: `${left}%`,
        top: '-20px',
        width: `${randomSize}px`,
        height: `${randomSize}px`,
        animationDelay: `${delay}ms`,
        transform: `rotate(${randomRotation}deg)`,
      }}
    />
  );
}

function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2000,
    left: Math.random() * 100,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} delay={piece.delay} left={piece.left} />
      ))}
    </div>
  );
}

// ================================================================
// CHECK ICON
// ================================================================

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

// ================================================================
// FEATURE UNLOCK ANIMATION
// ================================================================

interface FeatureUnlockProps {
  feature: string;
  delay: number;
}

function FeatureUnlock({ feature, delay }: FeatureUnlockProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`flex items-center gap-3 transition-all duration-500 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      }`}
    >
      <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
    </div>
  );
}

// ================================================================
// CONTENT COMPONENT (WITH SEARCH PARAMS)
// ================================================================

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);
  const [planDetails, setPlanDetails] = useState<{
    name: string;
    features: string[];
  } | null>(null);

  // Get plan from URL or default to starter
  const planId = (searchParams.get('plan') as PlanId) || 'starter';
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Get plan details
    const plan = PLANS[planId] || PLANS.starter;
    setPlanDetails({
      name: plan.name,
      features: plan.features,
    });

    // Hide confetti after animation
    const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);

    return () => clearTimeout(confettiTimer);
  }, [planId]);

  // Redirect to dashboard after delay
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push('/dashboard');
    }, 10000);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  if (!planDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      {/* Confetti Animation */}
      {showConfetti && <Confetti />}

      {/* Success Card */}
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center animate-scale-in">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-bounce-once">
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to {planDetails.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your subscription is now active. Here's what you've unlocked:
        </p>

        {/* Unlocked Features */}
        <div className="text-left space-y-3 mb-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
          {planDetails.features.map((feature, index) => (
            <FeatureUnlock
              key={index}
              feature={feature}
              delay={500 + index * 200}
            />
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/analyze"
            className="block w-full py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Start New Analysis
          </Link>
        </div>

        {/* Auto-redirect notice */}
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Redirecting to dashboard in a few seconds...
        </p>

        {/* Session ID for debugging */}
        {sessionId && (
          <p className="mt-4 text-xs text-gray-400 font-mono">
            Session: {sessionId.slice(0, 20)}...
          </p>
        )}
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-confetti-fall {
          animation: confetti-fall 3s ease-out forwards;
        }

        @keyframes scale-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }

        @keyframes bounce-once {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

// ================================================================
// LOADING FALLBACK
// ================================================================

function BillingSuccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}

// ================================================================
// MAIN PAGE COMPONENT
// ================================================================

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<BillingSuccessLoading />}>
      <BillingSuccessContent />
    </Suspense>
  );
}
