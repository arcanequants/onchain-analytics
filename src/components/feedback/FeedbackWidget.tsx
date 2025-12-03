'use client';

/**
 * Feedback Widget Component
 *
 * Phase 4, Week 8, Day 3
 * User feedback collection for AI analysis results
 */

import { useState, useCallback } from 'react';

// ================================================================
// TYPES
// ================================================================

export type FeedbackType = 'accuracy' | 'helpfulness' | 'bug' | 'feature' | 'other';

export interface FeedbackData {
  type: FeedbackType;
  rating?: number; // 1-5
  isPositive?: boolean;
  message?: string;
  analysisId?: string;
  pageUrl?: string;
  userAgent?: string;
  timestamp?: string;
}

interface FeedbackWidgetProps {
  analysisId?: string;
  variant?: 'inline' | 'modal' | 'floating';
  onSubmit?: (feedback: FeedbackData) => void;
  showRating?: boolean;
  showMessage?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

// ================================================================
// FEEDBACK WIDGET
// ================================================================

export function FeedbackWidget({
  analysisId,
  variant = 'inline',
  onSubmit,
  showRating = true,
  showMessage = true,
  position = 'bottom-right',
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(variant !== 'floating');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('helpfulness');
  const [rating, setRating] = useState<number>(0);
  const [isPositive, setIsPositive] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!rating && isPositive === null && !message) {
      return;
    }

    setIsSubmitting(true);

    const feedback: FeedbackData = {
      type: feedbackType,
      rating: rating || undefined,
      isPositive: isPositive ?? undefined,
      message: message || undefined,
      analysisId,
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      // Send to API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Call onSubmit callback if provided
      onSubmit?.(feedback);

      setIsSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Feedback submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackType, rating, isPositive, message, analysisId, onSubmit]);

  // Floating button trigger
  if (variant === 'floating' && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${position === 'bottom-right' ? 'right-4' : 'left-4'} bottom-4 z-50 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg transition-all hover:scale-105`}
        aria-label="Give feedback"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div
        className={`${variant === 'floating' ? `fixed ${position === 'bottom-right' ? 'right-4' : 'left-4'} bottom-4 z-50` : ''} p-6 bg-gray-800 rounded-xl border border-gray-700 text-center`}
      >
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-medium">Thank you for your feedback!</p>
        <p className="text-gray-400 text-sm mt-1">Your input helps us improve.</p>
      </div>
    );
  }

  return (
    <div
      className={`${variant === 'floating' ? `fixed ${position === 'bottom-right' ? 'right-4' : 'left-4'} bottom-4 z-50 max-w-sm` : ''} p-6 bg-gray-800 rounded-xl border border-gray-700`}
    >
      {variant === 'floating' && (
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white"
          aria-label="Close feedback"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <h3 className="text-lg font-semibold text-white mb-4">How was your experience?</h3>

      {/* Quick Thumbs Feedback */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setIsPositive(true)}
          className={`flex-1 p-3 rounded-lg border transition-all ${
            isPositive === true
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
          }`}
          aria-label="Positive feedback"
        >
          <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
          <span className="text-sm mt-1 block">Helpful</span>
        </button>

        <button
          onClick={() => setIsPositive(false)}
          className={`flex-1 p-3 rounded-lg border transition-all ${
            isPositive === false
              ? 'bg-red-500/20 border-red-500 text-red-400'
              : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
          }`}
          aria-label="Negative feedback"
        >
          <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
            />
          </svg>
          <span className="text-sm mt-1 block">Not helpful</span>
        </button>
      </div>

      {/* Star Rating */}
      {showRating && (
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Rate this analysis (optional)</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`p-1 transition-colors ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-500'
                }`}
                aria-label={`Rate ${star} stars`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Type */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Feedback type</label>
        <select
          value={feedbackType}
          onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="helpfulness">Helpfulness</option>
          <option value="accuracy">Accuracy</option>
          <option value="bug">Report a bug</option>
          <option value="feature">Feature request</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Message */}
      {showMessage && (
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Additional comments (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us more about your experience..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-indigo-500"
            rows={3}
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || (rating === 0 && isPositive === null && !message)}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  );
}

// ================================================================
// SIMPLE THUMBS FEEDBACK
// ================================================================

interface ThumbsFeedbackProps {
  analysisId: string;
  onFeedback?: (isPositive: boolean) => void;
}

export function ThumbsFeedback({ analysisId, onFeedback }: ThumbsFeedbackProps) {
  const [submitted, setSubmitted] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = async (isPositive: boolean) => {
    if (submitted) return;

    setSubmitted(isPositive ? 'positive' : 'negative');

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'helpfulness',
          isPositive,
          analysisId,
          pageUrl: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });

      onFeedback?.(isPositive);
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Thanks for your feedback!
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400">Was this helpful?</span>
      <button
        onClick={() => handleFeedback(true)}
        className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded transition-colors"
        aria-label="Yes, helpful"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
      </button>
      <button
        onClick={() => handleFeedback(false)}
        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
        aria-label="No, not helpful"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
          />
        </svg>
      </button>
    </div>
  );
}

// ================================================================
// NPS SURVEY
// ================================================================

interface NPSSurveyProps {
  onSubmit?: (score: number, feedback?: string) => void;
  onDismiss?: () => void;
}

export function NPSSurvey({ onSubmit, onDismiss }: NPSSurveyProps) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (score === null) return;

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'other',
          rating: score,
          message: feedback || `NPS Score: ${score}`,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          timestamp: new Date().toISOString(),
        }),
      });

      onSubmit?.(score, feedback);
      setSubmitted(true);
    } catch (error) {
      console.error('NPS submission error:', error);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 text-center">
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-medium">Thank you!</p>
        <p className="text-gray-400 text-sm mt-1">Your feedback helps us improve.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-white">
          How likely are you to recommend AI Perception?
        </h3>
        {onDismiss && (
          <button onClick={onDismiss} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between gap-1 mb-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => setScore(n)}
              className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                score === n
                  ? n <= 6
                    ? 'bg-red-500 text-white'
                    : n <= 8
                      ? 'bg-yellow-500 text-black'
                      : 'bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
      </div>

      {score !== null && (
        <>
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">
              {score <= 6
                ? 'What could we improve?'
                : score <= 8
                  ? 'What would make it a 10?'
                  : 'What do you love about it?'}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Your feedback..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-indigo-500"
              rows={2}
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
          >
            Submit
          </button>
        </>
      )}
    </div>
  );
}

export default FeedbackWidget;
