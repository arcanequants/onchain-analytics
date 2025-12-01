'use client';

/**
 * Outcome Tracking Component
 *
 * Tracks and displays A/B comparison outcomes and calibration feedback.
 * Used to gather preference pairs for RLHF training and score calibration.
 *
 * Features:
 * - Side-by-side analysis comparison
 * - Preference selection (A vs B vs Tie)
 * - Score calibration feedback
 * - Visual representation of choices
 *
 * @module components/feedback/OutcomeTracking
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalysisSummary {
  id: string;
  title: string;
  score: number;
  date: string;
  thumbnail?: string;
  highlights?: string[];
}

export interface ComparisonOutcome {
  analysisAId: string;
  analysisBId: string;
  preferred: 'a' | 'b' | 'tie' | 'skip';
  confidence: number;
  reason?: string;
  timeSpentMs: number;
}

export interface CalibrationOutcome {
  analysisId: string;
  rawScore: number;
  calibratedScore: number;
  perceivedAccuracy: 'way_too_low' | 'too_low' | 'accurate' | 'too_high' | 'way_too_high';
  expectedScore?: number;
  satisfactionRating?: number;
}

export interface PreferenceComparisonProps {
  /** First analysis to compare */
  analysisA: AnalysisSummary;
  /** Second analysis to compare */
  analysisB: AnalysisSummary;
  /** Question prompt for the comparison */
  prompt?: string;
  /** Called when user makes a choice */
  onChoice: (outcome: ComparisonOutcome) => void | Promise<void>;
  /** Allow skipping */
  allowSkip?: boolean;
  /** Custom class name */
  className?: string;
}

export interface CalibrationFeedbackProps {
  /** Analysis ID */
  analysisId: string;
  /** Raw score before calibration */
  rawScore: number;
  /** Calibrated score */
  calibratedScore: number;
  /** Analysis title for context */
  title?: string;
  /** Called when feedback is submitted */
  onSubmit: (outcome: CalibrationOutcome) => void | Promise<void>;
  /** Custom class name */
  className?: string;
}

export interface OutcomeHistoryProps {
  /** Recent outcomes to display */
  outcomes: Array<{
    id: string;
    type: 'comparison' | 'calibration';
    date: string;
    summary: string;
  }>;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// PREFERENCE COMPARISON COMPONENT
// ============================================================================

/**
 * Side-by-side comparison for collecting preference pairs
 */
export function PreferenceComparison({
  analysisA,
  analysisB,
  prompt = 'Which analysis was more helpful?',
  onChoice,
  allowSkip = true,
  className = '',
}: PreferenceComparisonProps) {
  const [selected, setSelected] = useState<'a' | 'b' | 'tie' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const handleSelect = useCallback((choice: 'a' | 'b' | 'tie') => {
    setSelected(choice);
    setShowReasonInput(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selected) return;

    const timeSpentMs = Date.now() - startTimeRef.current;

    const outcome: ComparisonOutcome = {
      analysisAId: analysisA.id,
      analysisBId: analysisB.id,
      preferred: selected,
      confidence: selected === 'tie' ? 0.5 : 0.8,
      reason: reason || undefined,
      timeSpentMs,
    };

    try {
      setIsSubmitting(true);
      await onChoice(outcome);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit preference:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selected, reason, analysisA.id, analysisB.id, onChoice]);

  const handleSkip = useCallback(async () => {
    const timeSpentMs = Date.now() - startTimeRef.current;

    const outcome: ComparisonOutcome = {
      analysisAId: analysisA.id,
      analysisBId: analysisB.id,
      preferred: 'skip',
      confidence: 0,
      timeSpentMs,
    };

    try {
      setIsSubmitting(true);
      await onChoice(outcome);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to skip comparison:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [analysisA.id, analysisB.id, onChoice]);

  if (isSubmitted) {
    return (
      <div className={`preference-comparison preference-comparison--submitted ${className}`}>
        <div className="preference-comparison__thanks">
          <CheckIcon />
          <span>Thank you for your feedback!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`preference-comparison ${className}`}>
      <h3 className="preference-comparison__prompt">{prompt}</h3>

      <div className="preference-comparison__grid">
        {/* Analysis A */}
        <button
          type="button"
          className={`preference-comparison__card ${selected === 'a' ? 'preference-comparison__card--selected' : ''}`}
          onClick={() => handleSelect('a')}
          disabled={isSubmitting}
          aria-pressed={selected === 'a'}
        >
          <div className="preference-comparison__label">A</div>
          <div className="preference-comparison__content">
            <h4 className="preference-comparison__title">{analysisA.title}</h4>
            <div className="preference-comparison__score">
              <ScoreDisplay score={analysisA.score} />
            </div>
            <div className="preference-comparison__date">{analysisA.date}</div>
            {analysisA.highlights && (
              <ul className="preference-comparison__highlights">
                {analysisA.highlights.slice(0, 3).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}
          </div>
          {selected === 'a' && (
            <div className="preference-comparison__checkmark">
              <CheckIcon />
            </div>
          )}
        </button>

        {/* VS Divider */}
        <div className="preference-comparison__vs">
          <span>VS</span>
        </div>

        {/* Analysis B */}
        <button
          type="button"
          className={`preference-comparison__card ${selected === 'b' ? 'preference-comparison__card--selected' : ''}`}
          onClick={() => handleSelect('b')}
          disabled={isSubmitting}
          aria-pressed={selected === 'b'}
        >
          <div className="preference-comparison__label">B</div>
          <div className="preference-comparison__content">
            <h4 className="preference-comparison__title">{analysisB.title}</h4>
            <div className="preference-comparison__score">
              <ScoreDisplay score={analysisB.score} />
            </div>
            <div className="preference-comparison__date">{analysisB.date}</div>
            {analysisB.highlights && (
              <ul className="preference-comparison__highlights">
                {analysisB.highlights.slice(0, 3).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}
          </div>
          {selected === 'b' && (
            <div className="preference-comparison__checkmark">
              <CheckIcon />
            </div>
          )}
        </button>
      </div>

      {/* Tie Option */}
      <button
        type="button"
        className={`preference-comparison__tie ${selected === 'tie' ? 'preference-comparison__tie--selected' : ''}`}
        onClick={() => handleSelect('tie')}
        disabled={isSubmitting}
        aria-pressed={selected === 'tie'}
      >
        <BalanceIcon />
        Both are equally helpful
      </button>

      {/* Reason Input */}
      {showReasonInput && (
        <div className="preference-comparison__reason">
          <label htmlFor="comparison-reason">
            Why did you choose this? (optional)
          </label>
          <textarea
            id="comparison-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us what made the difference..."
            rows={2}
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* Actions */}
      <div className="preference-comparison__actions">
        {allowSkip && (
          <button
            type="button"
            className="preference-comparison__skip"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip this comparison
          </button>
        )}
        <button
          type="button"
          className="preference-comparison__submit"
          onClick={handleSubmit}
          disabled={!selected || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Choice'}
        </button>
      </div>

      <style jsx>{`
        .preference-comparison {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          background: var(--color-surface, #f8f9fa);
          border-radius: 12px;
        }

        .preference-comparison--submitted {
          background: var(--color-success-bg, #d4edda);
        }

        .preference-comparison__thanks {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px;
          color: var(--color-success, #28a745);
          font-weight: 500;
        }

        .preference-comparison__prompt {
          text-align: center;
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text, #212529);
          margin: 0;
        }

        .preference-comparison__grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 16px;
          align-items: stretch;
        }

        .preference-comparison__card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 16px;
          background: white;
          border: 2px solid var(--color-border, #dee2e6);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .preference-comparison__card:hover:not(:disabled) {
          border-color: var(--color-primary, #007bff);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .preference-comparison__card--selected {
          border-color: var(--color-primary, #007bff);
          background: var(--color-primary-light, #e7f1ff);
        }

        .preference-comparison__label {
          position: absolute;
          top: -10px;
          left: 16px;
          padding: 2px 10px;
          background: var(--color-primary, #007bff);
          color: white;
          font-size: 12px;
          font-weight: 600;
          border-radius: 10px;
        }

        .preference-comparison__content {
          margin-top: 8px;
        }

        .preference-comparison__title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: var(--color-text, #212529);
        }

        .preference-comparison__score {
          margin-bottom: 8px;
        }

        .preference-comparison__date {
          font-size: 12px;
          color: var(--color-text-secondary, #6c757d);
        }

        .preference-comparison__highlights {
          margin: 8px 0 0 0;
          padding-left: 16px;
          font-size: 12px;
          color: var(--color-text-secondary, #6c757d);
        }

        .preference-comparison__highlights li {
          margin-bottom: 4px;
        }

        .preference-comparison__checkmark {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: var(--color-primary, #007bff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .preference-comparison__vs {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 8px;
        }

        .preference-comparison__vs span {
          padding: 8px 12px;
          background: var(--color-text-secondary, #6c757d);
          color: white;
          font-size: 12px;
          font-weight: 700;
          border-radius: 20px;
        }

        .preference-comparison__tie {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: white;
          border: 2px solid var(--color-border, #dee2e6);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: var(--color-text-secondary, #6c757d);
          transition: all 0.2s ease;
        }

        .preference-comparison__tie:hover:not(:disabled) {
          border-color: var(--color-warning, #ffc107);
        }

        .preference-comparison__tie--selected {
          border-color: var(--color-warning, #ffc107);
          background: var(--color-warning-bg, #fff3cd);
          color: var(--color-text, #212529);
        }

        .preference-comparison__reason {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preference-comparison__reason label {
          font-size: 13px;
          color: var(--color-text-secondary, #6c757d);
        }

        .preference-comparison__reason textarea {
          padding: 10px;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
          font-size: 14px;
          resize: vertical;
        }

        .preference-comparison__reason textarea:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
        }

        .preference-comparison__actions {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 8px;
        }

        .preference-comparison__skip {
          padding: 10px 16px;
          background: transparent;
          border: none;
          color: var(--color-text-secondary, #6c757d);
          cursor: pointer;
          font-size: 14px;
        }

        .preference-comparison__skip:hover:not(:disabled) {
          color: var(--color-text, #212529);
        }

        .preference-comparison__submit {
          padding: 10px 24px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .preference-comparison__submit:hover:not(:disabled) {
          background: var(--color-primary-dark, #0056b3);
        }

        .preference-comparison__submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .preference-comparison__grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .preference-comparison__vs {
            padding: 8px 0;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// CALIBRATION FEEDBACK COMPONENT
// ============================================================================

/**
 * Feedback form for score calibration accuracy
 */
export function CalibrationFeedbackForm({
  analysisId,
  rawScore,
  calibratedScore,
  title,
  onSubmit,
  className = '',
}: CalibrationFeedbackProps) {
  const [perceivedAccuracy, setPerceivedAccuracy] = useState<CalibrationOutcome['perceivedAccuracy'] | null>(null);
  const [expectedScore, setExpectedScore] = useState<string>('');
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const accuracyOptions: Array<{ value: CalibrationOutcome['perceivedAccuracy']; label: string; icon: string }> = [
    { value: 'way_too_low', label: 'Way too low', icon: '<<' },
    { value: 'too_low', label: 'Too low', icon: '<' },
    { value: 'accurate', label: 'Accurate', icon: '=' },
    { value: 'too_high', label: 'Too high', icon: '>' },
    { value: 'way_too_high', label: 'Way too high', icon: '>>' },
  ];

  const handleSubmit = useCallback(async () => {
    if (!perceivedAccuracy) return;

    const outcome: CalibrationOutcome = {
      analysisId,
      rawScore,
      calibratedScore,
      perceivedAccuracy,
      expectedScore: expectedScore ? parseInt(expectedScore, 10) : undefined,
      satisfactionRating: satisfaction || undefined,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(outcome);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit calibration feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [analysisId, rawScore, calibratedScore, perceivedAccuracy, expectedScore, satisfaction, onSubmit]);

  if (isSubmitted) {
    return (
      <div className={`calibration-feedback calibration-feedback--submitted ${className}`}>
        <div className="calibration-feedback__thanks">
          <CheckIcon />
          <span>Thank you! Your feedback helps improve our scoring.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`calibration-feedback ${className}`}>
      {title && <h4 className="calibration-feedback__title">{title}</h4>}

      {/* Score Display */}
      <div className="calibration-feedback__scores">
        <div className="calibration-feedback__score-item">
          <span className="calibration-feedback__score-label">Original Score</span>
          <ScoreDisplay score={rawScore} size="small" />
        </div>
        <div className="calibration-feedback__arrow">→</div>
        <div className="calibration-feedback__score-item">
          <span className="calibration-feedback__score-label">Adjusted Score</span>
          <ScoreDisplay score={calibratedScore} size="small" />
        </div>
      </div>

      {/* Accuracy Selection */}
      <div className="calibration-feedback__section">
        <label className="calibration-feedback__label">
          How accurate is this adjusted score?
        </label>
        <div className="calibration-feedback__accuracy-options">
          {accuracyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`calibration-feedback__accuracy-btn ${perceivedAccuracy === option.value ? 'calibration-feedback__accuracy-btn--selected' : ''}`}
              onClick={() => setPerceivedAccuracy(option.value)}
              disabled={isSubmitting}
              aria-pressed={perceivedAccuracy === option.value}
            >
              <span className="calibration-feedback__accuracy-icon">{option.icon}</span>
              <span className="calibration-feedback__accuracy-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expected Score */}
      {perceivedAccuracy && perceivedAccuracy !== 'accurate' && (
        <div className="calibration-feedback__section">
          <label className="calibration-feedback__label" htmlFor="expected-score">
            What score did you expect? (optional)
          </label>
          <input
            id="expected-score"
            type="number"
            min="0"
            max="100"
            value={expectedScore}
            onChange={(e) => setExpectedScore(e.target.value)}
            placeholder="0-100"
            className="calibration-feedback__input"
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* Satisfaction Rating */}
      <div className="calibration-feedback__section">
        <label className="calibration-feedback__label">
          Overall satisfaction with the score (1-5)
        </label>
        <div className="calibration-feedback__stars">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={`calibration-feedback__star ${satisfaction && satisfaction >= value ? 'calibration-feedback__star--active' : ''}`}
              onClick={() => setSatisfaction(value)}
              disabled={isSubmitting}
              aria-label={`Rate ${value} out of 5`}
            >
              <StarIcon filled={satisfaction ? satisfaction >= value : false} />
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        className="calibration-feedback__submit"
        onClick={handleSubmit}
        disabled={!perceivedAccuracy || isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>

      <style jsx>{`
        .calibration-feedback {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          background: var(--color-surface, #f8f9fa);
          border-radius: 10px;
        }

        .calibration-feedback--submitted {
          background: var(--color-success-bg, #d4edda);
        }

        .calibration-feedback__thanks {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          color: var(--color-success, #28a745);
        }

        .calibration-feedback__title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: var(--color-text, #212529);
        }

        .calibration-feedback__scores {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 12px;
          background: white;
          border-radius: 8px;
        }

        .calibration-feedback__score-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .calibration-feedback__score-label {
          font-size: 11px;
          color: var(--color-text-secondary, #6c757d);
          text-transform: uppercase;
        }

        .calibration-feedback__arrow {
          font-size: 20px;
          color: var(--color-text-secondary, #6c757d);
        }

        .calibration-feedback__section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .calibration-feedback__label {
          font-size: 13px;
          color: var(--color-text-secondary, #6c757d);
        }

        .calibration-feedback__accuracy-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .calibration-feedback__accuracy-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 12px;
          background: white;
          border: 2px solid var(--color-border, #dee2e6);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          min-width: 70px;
        }

        .calibration-feedback__accuracy-btn:hover:not(:disabled) {
          border-color: var(--color-primary, #007bff);
        }

        .calibration-feedback__accuracy-btn--selected {
          border-color: var(--color-primary, #007bff);
          background: var(--color-primary-light, #e7f1ff);
        }

        .calibration-feedback__accuracy-icon {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-text, #212529);
        }

        .calibration-feedback__accuracy-label {
          font-size: 10px;
          color: var(--color-text-secondary, #6c757d);
        }

        .calibration-feedback__input {
          padding: 10px 12px;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
          font-size: 14px;
          max-width: 120px;
        }

        .calibration-feedback__input:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
        }

        .calibration-feedback__stars {
          display: flex;
          gap: 8px;
        }

        .calibration-feedback__star {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: white;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .calibration-feedback__star:hover:not(:disabled) {
          background: var(--color-hover, #e9ecef);
        }

        .calibration-feedback__star--active {
          color: var(--color-warning, #ffc107);
        }

        .calibration-feedback__submit {
          padding: 12px 24px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
          align-self: flex-start;
        }

        .calibration-feedback__submit:hover:not(:disabled) {
          background: var(--color-primary-dark, #0056b3);
        }

        .calibration-feedback__submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .calibration-feedback__accuracy-options {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// OUTCOME HISTORY COMPONENT
// ============================================================================

/**
 * Displays recent feedback outcomes for transparency
 */
export function OutcomeHistory({ outcomes, className = '' }: OutcomeHistoryProps) {
  if (outcomes.length === 0) {
    return null;
  }

  return (
    <div className={`outcome-history ${className}`}>
      <h4 className="outcome-history__title">Your Recent Feedback</h4>
      <ul className="outcome-history__list">
        {outcomes.slice(0, 5).map((outcome) => (
          <li key={outcome.id} className="outcome-history__item">
            <span className="outcome-history__icon">
              {outcome.type === 'comparison' ? <CompareIcon /> : <TuneIcon />}
            </span>
            <span className="outcome-history__summary">{outcome.summary}</span>
            <span className="outcome-history__date">{outcome.date}</span>
          </li>
        ))}
      </ul>

      <style jsx>{`
        .outcome-history {
          padding: 16px;
          background: var(--color-surface, #f8f9fa);
          border-radius: 8px;
        }

        .outcome-history__title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: var(--color-text, #212529);
        }

        .outcome-history__list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .outcome-history__item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid var(--color-border, #dee2e6);
          font-size: 13px;
        }

        .outcome-history__item:last-child {
          border-bottom: none;
        }

        .outcome-history__icon {
          color: var(--color-text-secondary, #6c757d);
        }

        .outcome-history__summary {
          flex: 1;
          color: var(--color-text, #212529);
        }

        .outcome-history__date {
          color: var(--color-text-secondary, #6c757d);
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface ScoreDisplayProps {
  score: number;
  size?: 'small' | 'medium';
}

function ScoreDisplay({ score, size = 'medium' }: ScoreDisplayProps) {
  const getColor = (s: number) => {
    if (s >= 80) return 'var(--color-success, #28a745)';
    if (s >= 60) return 'var(--color-warning, #ffc107)';
    if (s >= 40) return 'var(--color-info, #17a2b8)';
    return 'var(--color-danger, #dc3545)';
  };

  return (
    <div
      className={`score-display score-display--${size}`}
      style={{ '--score-color': getColor(score) } as React.CSSProperties}
    >
      <span className="score-display__value">{score}</span>
      <style jsx>{`
        .score-display {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--score-color);
        }

        .score-display--small {
          font-size: 20px;
        }

        .score-display--medium {
          font-size: 28px;
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function BalanceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v18M3 9l9-6 9 6M3 9l3 6a6 6 0 0 0 6 0l3-6M15 9l3 6a6 6 0 0 0 6 0" />
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

function CompareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <rect x="14" y="3" width="7" height="18" rx="1" />
    </svg>
  );
}

function TuneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PreferenceComparison;
