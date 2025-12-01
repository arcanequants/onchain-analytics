'use client';

/**
 * Hallucination Report Component
 *
 * Allows users to report and correct AI-generated inaccuracies.
 * Supports various types of hallucinations:
 * - Factual errors (founding date, location, etc.)
 * - Missing information
 * - Outdated information
 * - Incorrect associations
 *
 * @module components/feedback/HallucinationReport
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type HallucinationType =
  | 'factual_error'
  | 'outdated_info'
  | 'missing_info'
  | 'wrong_association'
  | 'fabricated'
  | 'other';

export interface AIStatement {
  id: string;
  category: string;
  statement: string;
  source?: string;
  confidence?: number;
}

export interface HallucinationCorrection {
  statementId: string;
  type: HallucinationType;
  isAccurate: boolean;
  correctedValue?: string;
  explanation?: string;
  sourceUrl?: string;
}

export interface HallucinationReportResult {
  analysisId: string;
  corrections: HallucinationCorrection[];
  additionalNotes?: string;
}

export interface HallucinationReportProps {
  /** Analysis ID */
  analysisId: string;
  /** AI-generated statements to verify */
  statements: AIStatement[];
  /** Brand name for context */
  brandName?: string;
  /** Called when report is submitted */
  onSubmit: (result: HallucinationReportResult) => void | Promise<void>;
  /** Compact mode (fewer fields) */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export interface SingleStatementReportProps {
  /** Analysis ID */
  analysisId: string;
  /** The statement to verify */
  statement: AIStatement;
  /** Called when correction is submitted */
  onSubmit: (correction: HallucinationCorrection) => void | Promise<void>;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// HALLUCINATION TYPE CONFIG
// ============================================================================

const HALLUCINATION_TYPES: Array<{
  value: HallucinationType;
  label: string;
  description: string;
}> = [
  {
    value: 'factual_error',
    label: 'Factual Error',
    description: 'The information is incorrect',
  },
  {
    value: 'outdated_info',
    label: 'Outdated',
    description: 'Was true before, but no longer accurate',
  },
  {
    value: 'missing_info',
    label: 'Incomplete',
    description: 'Missing important context or details',
  },
  {
    value: 'wrong_association',
    label: 'Wrong Association',
    description: 'Confused with another company/product',
  },
  {
    value: 'fabricated',
    label: 'Fabricated',
    description: 'Made up / never existed',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Different type of error',
  },
];

// ============================================================================
// SINGLE STATEMENT REPORT (Inline)
// ============================================================================

export function SingleStatementReport({
  analysisId,
  statement,
  onSubmit,
  className = '',
}: SingleStatementReportProps) {
  const [isReporting, setIsReporting] = useState(false);
  const [isAccurate, setIsAccurate] = useState<boolean | null>(null);
  const [errorType, setErrorType] = useState<HallucinationType>('factual_error');
  const [correctedValue, setCorrectedValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAccuracySelect = useCallback((accurate: boolean) => {
    setIsAccurate(accurate);
    if (!accurate) {
      setIsReporting(true);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isAccurate === null) return;

    const correction: HallucinationCorrection = {
      statementId: statement.id,
      type: isAccurate ? 'factual_error' : errorType,
      isAccurate,
      correctedValue: correctedValue.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(correction);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit hallucination report:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [statement.id, isAccurate, errorType, correctedValue, onSubmit]);

  if (isSubmitted) {
    return (
      <div className={`single-statement-report single-statement-report--submitted ${className}`}>
        <span className="single-statement-report__thanks">
          <CheckIcon /> Thanks for the feedback!
        </span>
      </div>
    );
  }

  return (
    <div className={`single-statement-report ${className}`}>
      {/* Statement Display */}
      <div className="single-statement-report__statement">
        <span className="single-statement-report__category">{statement.category}:</span>
        <span className="single-statement-report__text">"{statement.statement}"</span>
      </div>

      {/* Accuracy Question */}
      {isAccurate === null && (
        <div className="single-statement-report__accuracy">
          <span className="single-statement-report__question">Is this correct?</span>
          <div className="single-statement-report__buttons">
            <button
              type="button"
              className="single-statement-report__btn single-statement-report__btn--yes"
              onClick={() => handleAccuracySelect(true)}
              disabled={isSubmitting}
            >
              <CheckIcon /> Yes
            </button>
            <button
              type="button"
              className="single-statement-report__btn single-statement-report__btn--no"
              onClick={() => handleAccuracySelect(false)}
              disabled={isSubmitting}
            >
              <XIcon /> No
            </button>
          </div>
        </div>
      )}

      {/* Correction Form */}
      {isReporting && !isAccurate && (
        <div className="single-statement-report__correction">
          <div className="single-statement-report__field">
            <label className="single-statement-report__label">Error Type</label>
            <select
              value={errorType}
              onChange={(e) => setErrorType(e.target.value as HallucinationType)}
              disabled={isSubmitting}
              className="single-statement-report__select"
            >
              {HALLUCINATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="single-statement-report__field">
            <label className="single-statement-report__label">Correct Information</label>
            <input
              type="text"
              value={correctedValue}
              onChange={(e) => setCorrectedValue(e.target.value)}
              placeholder="What's the correct information?"
              disabled={isSubmitting}
              className="single-statement-report__input"
            />
          </div>

          <button
            type="button"
            className="single-statement-report__submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Correction'}
          </button>
        </div>
      )}

      {/* Confirmed Accurate */}
      {isAccurate === true && (
        <div className="single-statement-report__confirmed">
          <span className="single-statement-report__confirmed-text">
            <CheckIcon /> Confirmed accurate
          </span>
        </div>
      )}

      <style jsx>{`
        .single-statement-report {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          background: var(--color-surface, #f8f9fa);
          border-radius: 8px;
          font-size: 14px;
        }

        .single-statement-report--submitted {
          padding: 8px 12px;
          background: var(--color-success-bg, #d4edda);
        }

        .single-statement-report__thanks {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--color-success, #28a745);
          font-size: 13px;
        }

        .single-statement-report__statement {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .single-statement-report__category {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--color-text-secondary, #6c757d);
        }

        .single-statement-report__text {
          color: var(--color-text, #212529);
          font-style: italic;
        }

        .single-statement-report__accuracy {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .single-statement-report__question {
          color: var(--color-text-secondary, #6c757d);
        }

        .single-statement-report__buttons {
          display: flex;
          gap: 8px;
        }

        .single-statement-report__btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .single-statement-report__btn--yes {
          background: var(--color-success-bg, #d4edda);
          border: 1px solid var(--color-success, #28a745);
          color: var(--color-success, #28a745);
        }

        .single-statement-report__btn--no {
          background: var(--color-danger-bg, #f8d7da);
          border: 1px solid var(--color-danger, #dc3545);
          color: var(--color-danger, #dc3545);
        }

        .single-statement-report__btn:hover:not(:disabled) {
          opacity: 0.8;
        }

        .single-statement-report__correction {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px;
          background: white;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
        }

        .single-statement-report__field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .single-statement-report__label {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary, #6c757d);
        }

        .single-statement-report__select,
        .single-statement-report__input {
          padding: 8px 10px;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
          font-size: 14px;
        }

        .single-statement-report__select:focus,
        .single-statement-report__input:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
        }

        .single-statement-report__submit {
          padding: 8px 16px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          align-self: flex-start;
        }

        .single-statement-report__submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .single-statement-report__confirmed {
          padding: 8px 0;
        }

        .single-statement-report__confirmed-text {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--color-success, #28a745);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// FULL HALLUCINATION REPORT
// ============================================================================

export function HallucinationReport({
  analysisId,
  statements,
  brandName,
  onSubmit,
  compact = false,
  className = '',
}: HallucinationReportProps) {
  const [corrections, setCorrections] = useState<Map<string, HallucinationCorrection>>(new Map());
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleStatementCorrection = useCallback((correction: HallucinationCorrection) => {
    setCorrections((prev) => {
      const newMap = new Map(prev);
      newMap.set(correction.statementId, correction);
      return newMap;
    });
  }, []);

  const handleSubmitAll = useCallback(async () => {
    const result: HallucinationReportResult = {
      analysisId,
      corrections: Array.from(corrections.values()),
      additionalNotes: additionalNotes.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(result);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit hallucination report:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [analysisId, corrections, additionalNotes, onSubmit]);

  const hasCorrections = corrections.size > 0;
  const hasInaccuracies = Array.from(corrections.values()).some((c) => !c.isAccurate);

  if (isSubmitted) {
    return (
      <div className={`hallucination-report hallucination-report--submitted ${className}`}>
        <div className="hallucination-report__thanks">
          <CheckIcon />
          <div>
            <strong>Thank you for your feedback!</strong>
            <p>Your corrections help us improve AI accuracy for everyone.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`hallucination-report ${className}`}>
      <div className="hallucination-report__header">
        <h3 className="hallucination-report__title">
          <AlertIcon /> Verify AI-Generated Information
        </h3>
        <p className="hallucination-report__subtitle">
          {brandName
            ? `Help us improve accuracy for ${brandName}`
            : 'Help us improve AI accuracy by verifying these statements'}
        </p>
      </div>

      {/* Statements to Verify */}
      <div className="hallucination-report__statements">
        {statements.map((statement) => (
          <SingleStatementReport
            key={statement.id}
            analysisId={analysisId}
            statement={statement}
            onSubmit={(correction) => handleStatementCorrection(correction)}
          />
        ))}
      </div>

      {/* Additional Notes */}
      {!compact && (
        <div className="hallucination-report__notes">
          <label className="hallucination-report__label" htmlFor="additional-notes">
            Additional notes or corrections
          </label>
          <textarea
            id="additional-notes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any other inaccuracies you noticed?"
            rows={3}
            disabled={isSubmitting}
            className="hallucination-report__textarea"
          />
        </div>
      )}

      {/* Summary and Submit */}
      {(hasCorrections || additionalNotes) && (
        <div className="hallucination-report__footer">
          {hasInaccuracies && (
            <div className="hallucination-report__summary">
              <WarningIcon />
              <span>
                {Array.from(corrections.values()).filter((c) => !c.isAccurate).length} inaccuracies
                reported
              </span>
            </div>
          )}
          <button
            type="button"
            className="hallucination-report__submit"
            onClick={handleSubmitAll}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit All Feedback'}
          </button>
        </div>
      )}

      <style jsx>{`
        .hallucination-report {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          background: var(--color-surface, #f8f9fa);
          border-radius: 10px;
        }

        .hallucination-report--submitted {
          background: var(--color-success-bg, #d4edda);
        }

        .hallucination-report__thanks {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          color: var(--color-success, #28a745);
        }

        .hallucination-report__thanks p {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: var(--color-text-secondary, #6c757d);
        }

        .hallucination-report__header {
          margin-bottom: 8px;
        }

        .hallucination-report__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: var(--color-text, #212529);
        }

        .hallucination-report__subtitle {
          font-size: 13px;
          color: var(--color-text-secondary, #6c757d);
          margin: 0;
        }

        .hallucination-report__statements {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hallucination-report__notes {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border, #dee2e6);
        }

        .hallucination-report__label {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text, #212529);
        }

        .hallucination-report__textarea {
          padding: 10px 12px;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
          font-size: 14px;
          resize: vertical;
        }

        .hallucination-report__textarea:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
        }

        .hallucination-report__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid var(--color-border, #dee2e6);
        }

        .hallucination-report__summary {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--color-warning-dark, #856404);
        }

        .hallucination-report__submit {
          padding: 10px 20px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .hallucination-report__submit:hover:not(:disabled) {
          background: var(--color-primary-dark, #0056b3);
        }

        .hallucination-report__submit:disabled {
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

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 6v4h2v-4h-2zm0 6v2h2v-2h-2z" />
    </svg>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default HallucinationReport;
