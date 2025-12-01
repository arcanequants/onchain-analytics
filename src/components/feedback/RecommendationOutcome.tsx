'use client';

/**
 * Recommendation Outcome Tracking Component
 *
 * Tracks user responses to recommendations and their outcomes.
 * Supports the full lifecycle:
 * 1. Initial response (will do / won't do / need help)
 * 2. Implementation confirmation
 * 3. Outcome reporting
 *
 * @module components/feedback/RecommendationOutcome
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type InitialResponse =
  | 'will_implement'
  | 'wont_implement'
  | 'need_help'
  | 'already_done'
  | 'not_applicable'
  | 'skipped';

export type OutcomeImpact =
  | 'significant_improvement'
  | 'some_improvement'
  | 'no_change'
  | 'negative_impact'
  | 'unable_to_measure';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact?: string;
  estimatedEffort?: string;
}

export interface OutcomeData {
  recommendationId: string;
  initialResponse: InitialResponse;
  responseReason?: string;
  implemented?: boolean;
  implementationNotes?: string;
  outcomeImpact?: OutcomeImpact;
  outcomeNotes?: string;
}

export interface RecommendationResponseProps {
  /** The recommendation to respond to */
  recommendation: Recommendation;
  /** Analysis ID */
  analysisId: string;
  /** Current score for context */
  currentScore?: number;
  /** Called when user responds */
  onResponse: (data: OutcomeData) => void | Promise<void>;
  /** Compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export interface OutcomeFollowUpProps {
  /** Recommendation that was implemented */
  recommendation: Recommendation;
  /** Original outcome data */
  outcomeId: string;
  /** Score before implementation */
  scoreBefore?: number;
  /** Score after (from re-analysis) */
  scoreAfter?: number;
  /** Called when outcome is reported */
  onOutcomeReport: (impact: OutcomeImpact, notes?: string) => void | Promise<void>;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// RESPONSE OPTIONS CONFIG
// ============================================================================

const RESPONSE_OPTIONS: Array<{
  value: InitialResponse;
  label: string;
  icon: string;
  color: string;
}> = [
  { value: 'will_implement', label: 'Will implement', icon: '✓', color: 'success' },
  { value: 'wont_implement', label: "Won't do", icon: '✗', color: 'danger' },
  { value: 'need_help', label: 'Need help', icon: '?', color: 'warning' },
  { value: 'already_done', label: 'Already done', icon: '✓✓', color: 'info' },
  { value: 'not_applicable', label: 'Not applicable', icon: '—', color: 'secondary' },
];

const IMPACT_OPTIONS: Array<{
  value: OutcomeImpact;
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    value: 'significant_improvement',
    label: 'Major Improvement',
    description: 'Significant positive impact',
    emoji: '🚀',
  },
  {
    value: 'some_improvement',
    label: 'Some Improvement',
    description: 'Minor positive change',
    emoji: '📈',
  },
  {
    value: 'no_change',
    label: 'No Change',
    description: 'No noticeable difference',
    emoji: '➡️',
  },
  {
    value: 'negative_impact',
    label: 'Negative Impact',
    description: 'Made things worse',
    emoji: '📉',
  },
  {
    value: 'unable_to_measure',
    label: 'Unable to Measure',
    description: "Can't determine impact",
    emoji: '🤷',
  },
];

// ============================================================================
// RECOMMENDATION RESPONSE COMPONENT
// ============================================================================

export function RecommendationResponse({
  recommendation,
  analysisId,
  currentScore,
  onResponse,
  compact = false,
  className = '',
}: RecommendationResponseProps) {
  const [response, setResponse] = useState<InitialResponse | null>(null);
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResponseSelect = useCallback((value: InitialResponse) => {
    setResponse(value);
    // Show reason input for negative responses
    if (value === 'wont_implement' || value === 'not_applicable') {
      setShowReason(true);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!response) return;

    const data: OutcomeData = {
      recommendationId: recommendation.id,
      initialResponse: response,
      responseReason: reason.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      await onResponse(data);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [recommendation.id, response, reason, onResponse]);

  if (isSubmitted) {
    return (
      <div className={`rec-response rec-response--submitted ${className}`}>
        <span className="rec-response__thanks">
          <CheckIcon /> Response recorded
        </span>
      </div>
    );
  }

  return (
    <div className={`rec-response ${compact ? 'rec-response--compact' : ''} ${className}`}>
      {/* Recommendation Info */}
      {!compact && (
        <div className="rec-response__info">
          <div className="rec-response__header">
            <span className={`rec-response__priority rec-response__priority--${recommendation.priority}`}>
              {recommendation.priority}
            </span>
            <span className="rec-response__category">{recommendation.category}</span>
          </div>
          <h4 className="rec-response__title">{recommendation.title}</h4>
          <p className="rec-response__description">{recommendation.description}</p>
          {(recommendation.estimatedImpact || recommendation.estimatedEffort) && (
            <div className="rec-response__estimates">
              {recommendation.estimatedImpact && (
                <span>Impact: {recommendation.estimatedImpact}</span>
              )}
              {recommendation.estimatedEffort && (
                <span>Effort: {recommendation.estimatedEffort}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Response Options */}
      <div className="rec-response__options">
        {compact && <span className="rec-response__label">Your response:</span>}
        <div className="rec-response__buttons">
          {RESPONSE_OPTIONS.slice(0, compact ? 3 : 5).map((option) => (
            <button
              key={option.value}
              type="button"
              className={`rec-response__btn rec-response__btn--${option.color} ${response === option.value ? 'rec-response__btn--selected' : ''}`}
              onClick={() => handleResponseSelect(option.value)}
              disabled={isSubmitting}
              aria-pressed={response === option.value}
            >
              <span className="rec-response__btn-icon">{option.icon}</span>
              <span className="rec-response__btn-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reason Input */}
      {showReason && (
        <div className="rec-response__reason">
          <input
            type="text"
            placeholder="Why? (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
            className="rec-response__reason-input"
          />
        </div>
      )}

      {/* Submit */}
      {response && (
        <button
          type="button"
          className="rec-response__submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Confirm'}
        </button>
      )}

      <style jsx>{`
        .rec-response {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: var(--color-surface, #f8f9fa);
          border-radius: 10px;
        }

        .rec-response--compact {
          padding: 12px;
          gap: 8px;
        }

        .rec-response--submitted {
          padding: 10px 16px;
          background: var(--color-success-bg, #d4edda);
        }

        .rec-response__thanks {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--color-success, #28a745);
          font-size: 14px;
        }

        .rec-response__info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rec-response__header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rec-response__priority {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .rec-response__priority--high {
          background: var(--color-danger-bg, #f8d7da);
          color: var(--color-danger, #dc3545);
        }

        .rec-response__priority--medium {
          background: var(--color-warning-bg, #fff3cd);
          color: var(--color-warning-dark, #856404);
        }

        .rec-response__priority--low {
          background: var(--color-info-bg, #d1ecf1);
          color: var(--color-info, #0c5460);
        }

        .rec-response__category {
          font-size: 12px;
          color: var(--color-text-secondary, #6c757d);
        }

        .rec-response__title {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
          color: var(--color-text, #212529);
        }

        .rec-response__description {
          font-size: 13px;
          color: var(--color-text-secondary, #6c757d);
          margin: 0;
          line-height: 1.5;
        }

        .rec-response__estimates {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--color-text-secondary, #6c757d);
        }

        .rec-response__options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rec-response__label {
          font-size: 13px;
          color: var(--color-text-secondary, #6c757d);
        }

        .rec-response__buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .rec-response__btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 2px solid var(--color-border, #dee2e6);
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 13px;
        }

        .rec-response__btn:hover:not(:disabled) {
          border-color: var(--color-primary, #007bff);
        }

        .rec-response__btn--selected {
          border-color: var(--color-primary, #007bff);
          background: var(--color-primary-light, #e7f1ff);
        }

        .rec-response__btn--success.rec-response__btn--selected {
          border-color: var(--color-success, #28a745);
          background: var(--color-success-bg, #d4edda);
        }

        .rec-response__btn--danger.rec-response__btn--selected {
          border-color: var(--color-danger, #dc3545);
          background: var(--color-danger-bg, #f8d7da);
        }

        .rec-response__btn--warning.rec-response__btn--selected {
          border-color: var(--color-warning, #ffc107);
          background: var(--color-warning-bg, #fff3cd);
        }

        .rec-response__btn-icon {
          font-weight: 700;
        }

        .rec-response__reason {
          margin-top: 4px;
        }

        .rec-response__reason-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
          font-size: 14px;
        }

        .rec-response__reason-input:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
        }

        .rec-response__submit {
          align-self: flex-start;
          padding: 8px 20px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .rec-response__submit:hover:not(:disabled) {
          background: var(--color-primary-dark, #0056b3);
        }

        .rec-response__submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// OUTCOME FOLLOW-UP COMPONENT
// ============================================================================

export function OutcomeFollowUp({
  recommendation,
  outcomeId,
  scoreBefore,
  scoreAfter,
  onOutcomeReport,
  className = '',
}: OutcomeFollowUpProps) {
  const [impact, setImpact] = useState<OutcomeImpact | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const scoreChange = scoreBefore !== undefined && scoreAfter !== undefined
    ? scoreAfter - scoreBefore
    : null;

  const handleSubmit = useCallback(async () => {
    if (!impact) return;

    try {
      setIsSubmitting(true);
      await onOutcomeReport(impact, notes.trim() || undefined);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit outcome:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [impact, notes, onOutcomeReport]);

  if (isSubmitted) {
    return (
      <div className={`outcome-followup outcome-followup--submitted ${className}`}>
        <div className="outcome-followup__thanks">
          <CheckIcon />
          <span>Thank you! Your feedback helps us improve recommendations.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`outcome-followup ${className}`}>
      <div className="outcome-followup__header">
        <h3 className="outcome-followup__title">How did it go?</h3>
        <p className="outcome-followup__subtitle">
          You implemented: <strong>{recommendation.title}</strong>
        </p>
      </div>

      {/* Score Change Display */}
      {scoreChange !== null && (
        <div className="outcome-followup__score-change">
          <span className="outcome-followup__score-label">Score Change:</span>
          <span className={`outcome-followup__score-value ${scoreChange > 0 ? 'positive' : scoreChange < 0 ? 'negative' : ''}`}>
            {scoreChange > 0 ? '+' : ''}{scoreChange} points
          </span>
          <span className="outcome-followup__score-range">
            ({scoreBefore} → {scoreAfter})
          </span>
        </div>
      )}

      {/* Impact Selection */}
      <div className="outcome-followup__impact">
        <label className="outcome-followup__label">What was the impact?</label>
        <div className="outcome-followup__impact-options">
          {IMPACT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`outcome-followup__impact-btn ${impact === option.value ? 'outcome-followup__impact-btn--selected' : ''}`}
              onClick={() => setImpact(option.value)}
              disabled={isSubmitting}
              aria-pressed={impact === option.value}
            >
              <span className="outcome-followup__impact-emoji">{option.emoji}</span>
              <span className="outcome-followup__impact-label">{option.label}</span>
              <span className="outcome-followup__impact-desc">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      {impact && (
        <div className="outcome-followup__notes">
          <label className="outcome-followup__label" htmlFor="outcome-notes">
            Additional notes (optional)
          </label>
          <textarea
            id="outcome-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any details about the implementation or results?"
            rows={2}
            disabled={isSubmitting}
            className="outcome-followup__textarea"
          />
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        className="outcome-followup__submit"
        onClick={handleSubmit}
        disabled={!impact || isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Outcome'}
      </button>

      <style jsx>{`
        .outcome-followup {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          background: var(--color-surface, #f8f9fa);
          border-radius: 10px;
        }

        .outcome-followup--submitted {
          background: var(--color-success-bg, #d4edda);
        }

        .outcome-followup__thanks {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          color: var(--color-success, #28a745);
        }

        .outcome-followup__header {
          margin-bottom: 4px;
        }

        .outcome-followup__title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: var(--color-text, #212529);
        }

        .outcome-followup__subtitle {
          font-size: 14px;
          color: var(--color-text-secondary, #6c757d);
          margin: 0;
        }

        .outcome-followup__score-change {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: white;
          border-radius: 8px;
        }

        .outcome-followup__score-label {
          font-size: 14px;
          color: var(--color-text-secondary, #6c757d);
        }

        .outcome-followup__score-value {
          font-size: 18px;
          font-weight: 700;
        }

        .outcome-followup__score-value.positive {
          color: var(--color-success, #28a745);
        }

        .outcome-followup__score-value.negative {
          color: var(--color-danger, #dc3545);
        }

        .outcome-followup__score-range {
          font-size: 13px;
          color: var(--color-text-secondary, #6c757d);
        }

        .outcome-followup__impact {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .outcome-followup__label {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text, #212529);
        }

        .outcome-followup__impact-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 8px;
        }

        .outcome-followup__impact-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px;
          background: white;
          border: 2px solid var(--color-border, #dee2e6);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }

        .outcome-followup__impact-btn:hover:not(:disabled) {
          border-color: var(--color-primary, #007bff);
        }

        .outcome-followup__impact-btn--selected {
          border-color: var(--color-primary, #007bff);
          background: var(--color-primary-light, #e7f1ff);
        }

        .outcome-followup__impact-emoji {
          font-size: 24px;
        }

        .outcome-followup__impact-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text, #212529);
        }

        .outcome-followup__impact-desc {
          font-size: 11px;
          color: var(--color-text-secondary, #6c757d);
        }

        .outcome-followup__notes {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .outcome-followup__textarea {
          padding: 10px 12px;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
          font-size: 14px;
          resize: vertical;
        }

        .outcome-followup__textarea:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
        }

        .outcome-followup__submit {
          align-self: flex-start;
          padding: 10px 24px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .outcome-followup__submit:hover:not(:disabled) {
          background: var(--color-primary-dark, #0056b3);
        }

        .outcome-followup__submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RecommendationResponse;
