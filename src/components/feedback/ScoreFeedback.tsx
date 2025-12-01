'use client';

/**
 * Score Feedback Component
 *
 * Collects user feedback on analysis scores for RLHF training
 * Phase 1, Week 2 - RLHF Backlog
 */

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type FeedbackType = 'thumbs_up' | 'thumbs_down' | 'rating' | 'text' | 'correction';
export type FeedbackTarget =
  | 'analysis_score'
  | 'recommendation'
  | 'ai_response'
  | 'category_score'
  | 'overall_experience';

export interface FeedbackData {
  feedbackType: FeedbackType;
  target: FeedbackTarget;
  isPositive?: boolean;
  rating?: number;
  comment?: string;
  originalValue?: unknown;
  suggestedValue?: unknown;
  correctionReason?: string;
}

export interface ScoreFeedbackProps {
  /** Analysis ID this feedback is for */
  analysisId: string;
  /** What aspect of the score this feedback targets */
  target?: FeedbackTarget;
  /** Current score being rated */
  currentScore?: number;
  /** Callback when feedback is submitted */
  onFeedbackSubmit?: (data: FeedbackData) => void;
  /** Custom class name */
  className?: string;
  /** Show expanded form initially */
  expandedByDefault?: boolean;
  /** Variant: minimal (just thumbs), standard (thumbs + rating), full (all options) */
  variant?: 'minimal' | 'standard' | 'full';
}

export interface RecommendationFeedbackProps {
  /** Analysis ID */
  analysisId: string;
  /** Recommendation ID */
  recommendationId: string;
  /** Recommendation title */
  title: string;
  /** Callback when feedback is submitted */
  onFeedbackSubmit?: (data: FeedbackData) => void;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// SCORE FEEDBACK COMPONENT
// ============================================================================

export function ScoreFeedback({
  analysisId,
  target = 'analysis_score',
  currentScore,
  onFeedbackSubmit,
  className = '',
  expandedByDefault = false,
  variant = 'standard',
}: ScoreFeedbackProps) {
  const [thumbsState, setThumbsState] = useState<'up' | 'down' | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(expandedByDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [suggestedScore, setSuggestedScore] = useState<string>('');

  const handleThumbsClick = useCallback(
    async (isUp: boolean) => {
      const newState = isUp ? 'up' : 'down';

      // Toggle if clicking same button
      if ((isUp && thumbsState === 'up') || (!isUp && thumbsState === 'down')) {
        setThumbsState(null);
        return;
      }

      setThumbsState(newState);

      // Submit immediately for thumbs feedback
      const feedbackData: FeedbackData = {
        feedbackType: isUp ? 'thumbs_up' : 'thumbs_down',
        target,
        isPositive: isUp,
      };

      try {
        setIsSubmitting(true);
        await submitFeedback(analysisId, feedbackData);
        onFeedbackSubmit?.(feedbackData);

        // Show expanded form for negative feedback
        if (!isUp && variant !== 'minimal') {
          setIsExpanded(true);
        }
      } catch (error) {
        console.error('Failed to submit thumbs feedback:', error);
        setThumbsState(null);
      } finally {
        setIsSubmitting(false);
      }
    },
    [analysisId, target, thumbsState, onFeedbackSubmit, variant]
  );

  const handleRatingClick = useCallback((value: number) => {
    setRating((prev) => (prev === value ? null : value));
  }, []);

  const handleSubmitDetailed = useCallback(async () => {
    if (!rating && !comment && !suggestedScore) return;

    const feedbackData: FeedbackData = {
      feedbackType: suggestedScore ? 'correction' : rating ? 'rating' : 'text',
      target,
      rating: rating ?? undefined,
      comment: comment || undefined,
      originalValue: currentScore,
      suggestedValue: suggestedScore ? parseInt(suggestedScore, 10) : undefined,
      correctionReason: suggestedScore ? comment : undefined,
    };

    try {
      setIsSubmitting(true);
      await submitFeedback(analysisId, feedbackData);
      onFeedbackSubmit?.(feedbackData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit detailed feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [analysisId, target, currentScore, rating, comment, suggestedScore, onFeedbackSubmit]);

  if (isSubmitted) {
    return (
      <div className={`score-feedback score-feedback--submitted ${className}`}>
        <div className="score-feedback__thanks">
          <span className="score-feedback__check">&#10003;</span>
          <span>Thank you for your feedback!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`score-feedback score-feedback--${variant} ${className}`}>
      {/* Thumbs Section */}
      <div className="score-feedback__thumbs">
        <span className="score-feedback__label">Was this score helpful?</span>
        <div className="score-feedback__buttons">
          <button
            type="button"
            className={`score-feedback__thumb ${thumbsState === 'up' ? 'score-feedback__thumb--active' : ''}`}
            onClick={() => handleThumbsClick(true)}
            disabled={isSubmitting}
            aria-label="Score was helpful"
            aria-pressed={thumbsState === 'up'}
          >
            <ThumbsUpIcon />
          </button>
          <button
            type="button"
            className={`score-feedback__thumb ${thumbsState === 'down' ? 'score-feedback__thumb--active' : ''}`}
            onClick={() => handleThumbsClick(false)}
            disabled={isSubmitting}
            aria-label="Score was not helpful"
            aria-pressed={thumbsState === 'down'}
          >
            <ThumbsDownIcon />
          </button>
        </div>
      </div>

      {/* Rating Section (standard and full variants) */}
      {variant !== 'minimal' && (
        <div className="score-feedback__rating">
          <span className="score-feedback__label">Rate accuracy (1-5):</span>
          <div className="score-feedback__stars">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`score-feedback__star ${rating && rating >= value ? 'score-feedback__star--active' : ''}`}
                onClick={() => handleRatingClick(value)}
                disabled={isSubmitting}
                aria-label={`Rate ${value} out of 5`}
                aria-pressed={rating === value}
              >
                <StarIcon filled={rating ? rating >= value : false} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Form */}
      {variant === 'full' && (
        <>
          <button
            type="button"
            className="score-feedback__expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Less options' : 'More options'}
            <ChevronIcon direction={isExpanded ? 'up' : 'down'} />
          </button>

          {isExpanded && (
            <div className="score-feedback__expanded">
              {/* Score Correction */}
              <div className="score-feedback__correction">
                <label className="score-feedback__label" htmlFor="suggested-score">
                  Suggest a different score:
                </label>
                <input
                  id="suggested-score"
                  type="number"
                  min="0"
                  max="100"
                  value={suggestedScore}
                  onChange={(e) => setSuggestedScore(e.target.value)}
                  placeholder={currentScore?.toString() ?? '0-100'}
                  className="score-feedback__input"
                  disabled={isSubmitting}
                />
              </div>

              {/* Comment */}
              <div className="score-feedback__comment">
                <label className="score-feedback__label" htmlFor="feedback-comment">
                  Additional comments:
                </label>
                <textarea
                  id="feedback-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us why you think the score should be different..."
                  className="score-feedback__textarea"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <button
                type="button"
                className="score-feedback__submit"
                onClick={handleSubmitDetailed}
                disabled={isSubmitting || (!rating && !comment && !suggestedScore)}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .score-feedback {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: var(--color-surface, #f8f9fa);
          border-radius: 8px;
          font-size: 14px;
        }

        .score-feedback--submitted {
          background: var(--color-success-bg, #d4edda);
        }

        .score-feedback__thanks {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-success, #28a745);
        }

        .score-feedback__check {
          font-size: 18px;
        }

        .score-feedback__thumbs,
        .score-feedback__rating {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .score-feedback__label {
          color: var(--color-text-secondary, #6c757d);
          font-size: 13px;
        }

        .score-feedback__buttons,
        .score-feedback__stars {
          display: flex;
          gap: 8px;
        }

        .score-feedback__thumb,
        .score-feedback__star {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .score-feedback__thumb:hover,
        .score-feedback__star:hover {
          background: var(--color-hover, #e9ecef);
        }

        .score-feedback__thumb--active {
          background: var(--color-primary, #007bff);
          border-color: var(--color-primary, #007bff);
          color: white;
        }

        .score-feedback__star--active {
          color: var(--color-warning, #ffc107);
        }

        .score-feedback__expand-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px;
          background: none;
          border: none;
          color: var(--color-primary, #007bff);
          cursor: pointer;
          font-size: 13px;
        }

        .score-feedback__expanded {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--color-border, #dee2e6);
        }

        .score-feedback__correction,
        .score-feedback__comment {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .score-feedback__input,
        .score-feedback__textarea {
          padding: 8px 12px;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
          font-size: 14px;
        }

        .score-feedback__input:focus,
        .score-feedback__textarea:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
        }

        .score-feedback__textarea {
          resize: vertical;
          min-height: 60px;
        }

        .score-feedback__submit {
          padding: 10px 16px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.15s ease;
        }

        .score-feedback__submit:hover:not(:disabled) {
          background: var(--color-primary-dark, #0056b3);
        }

        .score-feedback__submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// RECOMMENDATION FEEDBACK COMPONENT
// ============================================================================

export function RecommendationFeedback({
  analysisId,
  recommendationId,
  title,
  onFeedbackSubmit,
  className = '',
}: RecommendationFeedbackProps) {
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = useCallback(
    async (helpful: boolean) => {
      if (isHelpful !== null) return; // Already submitted

      setIsSubmitting(true);
      setIsHelpful(helpful);

      const feedbackData: FeedbackData = {
        feedbackType: helpful ? 'thumbs_up' : 'thumbs_down',
        target: 'recommendation',
        isPositive: helpful,
      };

      try {
        await submitFeedback(analysisId, feedbackData, recommendationId);
        onFeedbackSubmit?.(feedbackData);
      } catch (error) {
        console.error('Failed to submit recommendation feedback:', error);
        setIsHelpful(null);
      } finally {
        setIsSubmitting(false);
      }
    },
    [analysisId, recommendationId, isHelpful, onFeedbackSubmit]
  );

  return (
    <div className={`recommendation-feedback ${className}`}>
      {isHelpful === null ? (
        <>
          <span className="recommendation-feedback__label">Was this helpful?</span>
          <div className="recommendation-feedback__buttons">
            <button
              type="button"
              onClick={() => handleClick(true)}
              disabled={isSubmitting}
              className="recommendation-feedback__btn recommendation-feedback__btn--yes"
              aria-label={`Mark "${title}" as helpful`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleClick(false)}
              disabled={isSubmitting}
              className="recommendation-feedback__btn recommendation-feedback__btn--no"
              aria-label={`Mark "${title}" as not helpful`}
            >
              No
            </button>
          </div>
        </>
      ) : (
        <span className="recommendation-feedback__thanks">
          Thanks for the feedback!
        </span>
      )}

      <style jsx>{`
        .recommendation-feedback {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .recommendation-feedback__label {
          color: var(--color-text-secondary, #6c757d);
        }

        .recommendation-feedback__buttons {
          display: flex;
          gap: 4px;
        }

        .recommendation-feedback__btn {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .recommendation-feedback__btn--yes {
          background: var(--color-success-bg, #d4edda);
          border: 1px solid var(--color-success, #28a745);
          color: var(--color-success, #28a745);
        }

        .recommendation-feedback__btn--no {
          background: var(--color-danger-bg, #f8d7da);
          border: 1px solid var(--color-danger, #dc3545);
          color: var(--color-danger, #dc3545);
        }

        .recommendation-feedback__btn:hover:not(:disabled) {
          opacity: 0.8;
        }

        .recommendation-feedback__btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .recommendation-feedback__thanks {
          color: var(--color-success, #28a745);
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// API HELPER
// ============================================================================

async function submitFeedback(
  analysisId: string,
  data: FeedbackData,
  recommendationId?: string
): Promise<void> {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      analysisId,
      recommendationId,
      ...data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit feedback: ${response.status}`);
  }
}

// ============================================================================
// ICONS
// ============================================================================

function ThumbsUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbsDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: direction === 'up' ? 'rotate(180deg)' : undefined }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ScoreFeedback;
