'use client';

/**
 * Competitor Validation Component
 *
 * Allows users to validate AI-detected competitors and suggest missing ones.
 * This feedback improves competitor detection accuracy over time.
 *
 * Features:
 * - Checkbox list for validating detected competitors
 * - Add missing competitors
 * - Explain why something is/isn't a competitor
 * - Industry context for better learning
 *
 * @module components/feedback/CompetitorValidation
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface DetectedCompetitor {
  id: string;
  name: string;
  domain?: string;
  score?: number;
  confidence?: number;
}

export interface CompetitorValidation {
  competitorId: string;
  isCompetitor: boolean;
  reason?: string;
}

export interface MissingCompetitor {
  name: string;
  domain?: string;
  reason?: string;
}

export interface CompetitorValidationResult {
  analysisId: string;
  validations: CompetitorValidation[];
  missingCompetitors: MissingCompetitor[];
  industryContext?: string;
}

export interface CompetitorValidationProps {
  /** Analysis ID */
  analysisId: string;
  /** Detected competitors from AI */
  competitors: DetectedCompetitor[];
  /** User's industry (for context) */
  industry?: string;
  /** Called when validation is submitted */
  onSubmit: (result: CompetitorValidationResult) => void | Promise<void>;
  /** Maximum competitors to show */
  maxVisible?: number;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// COMPETITOR VALIDATION COMPONENT
// ============================================================================

export function CompetitorValidation({
  analysisId,
  competitors,
  industry,
  onSubmit,
  maxVisible = 10,
  className = '',
}: CompetitorValidationProps) {
  const [validations, setValidations] = useState<Map<string, CompetitorValidation>>(
    () => new Map(competitors.slice(0, maxVisible).map((c) => [
      c.id,
      { competitorId: c.id, isCompetitor: true },
    ]))
  );
  const [missingCompetitors, setMissingCompetitors] = useState<MissingCompetitor[]>([]);
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [newCompetitorDomain, setNewCompetitorDomain] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeReasonId, setActiveReasonId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const visibleCompetitors = competitors.slice(0, maxVisible);

  const handleToggle = useCallback((competitorId: string, isCompetitor: boolean) => {
    setValidations((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(competitorId);
      newMap.set(competitorId, {
        competitorId,
        isCompetitor,
        reason: existing?.reason,
      });
      return newMap;
    });

    // Show reason input when marking as not a competitor
    if (!isCompetitor) {
      setActiveReasonId(competitorId);
    }
  }, []);

  const handleReasonChange = useCallback((competitorId: string, reason: string) => {
    setValidations((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(competitorId);
      if (existing) {
        newMap.set(competitorId, { ...existing, reason });
      }
      return newMap;
    });
  }, []);

  const handleAddCompetitor = useCallback(() => {
    if (!newCompetitorName.trim()) return;

    setMissingCompetitors((prev) => [
      ...prev,
      {
        name: newCompetitorName.trim(),
        domain: newCompetitorDomain.trim() || undefined,
      },
    ]);

    setNewCompetitorName('');
    setNewCompetitorDomain('');
    setShowAddForm(false);
  }, [newCompetitorName, newCompetitorDomain]);

  const handleRemoveMissing = useCallback((index: number) => {
    setMissingCompetitors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    const result: CompetitorValidationResult = {
      analysisId,
      validations: Array.from(validations.values()),
      missingCompetitors,
      industryContext: industry,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(result);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit competitor validation:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [analysisId, validations, missingCompetitors, industry, onSubmit]);

  // Check if any changes were made
  const hasChanges =
    Array.from(validations.values()).some((v) => !v.isCompetitor || v.reason) ||
    missingCompetitors.length > 0;

  if (isSubmitted) {
    return (
      <div className={`competitor-validation competitor-validation--submitted ${className}`}>
        <div className="competitor-validation__thanks">
          <CheckIcon />
          <span>Thank you! Your feedback helps improve our competitor detection.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`competitor-validation ${className}`}>
      <div className="competitor-validation__header">
        <h3 className="competitor-validation__title">Detected Competitors</h3>
        <p className="competitor-validation__subtitle">
          Help us improve by confirming which are actual competitors
        </p>
      </div>

      {/* Competitor List */}
      <div className="competitor-validation__list">
        {visibleCompetitors.map((competitor) => {
          const validation = validations.get(competitor.id);
          const isConfirmed = validation?.isCompetitor ?? true;

          return (
            <div
              key={competitor.id}
              className={`competitor-validation__item ${!isConfirmed ? 'competitor-validation__item--rejected' : ''}`}
            >
              <div className="competitor-validation__item-main">
                <label className="competitor-validation__checkbox-label">
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => handleToggle(competitor.id, e.target.checked)}
                    disabled={isSubmitting}
                    className="competitor-validation__checkbox"
                  />
                  <div className="competitor-validation__competitor-info">
                    <span className="competitor-validation__name">{competitor.name}</span>
                    {competitor.domain && (
                      <span className="competitor-validation__domain">{competitor.domain}</span>
                    )}
                  </div>
                </label>
                {competitor.score !== undefined && (
                  <div className="competitor-validation__score">
                    Score: {competitor.score}
                  </div>
                )}
              </div>

              {/* Reason input for rejected competitors */}
              {!isConfirmed && (
                <div className="competitor-validation__reason">
                  <input
                    type="text"
                    placeholder="Why isn't this a competitor? (optional)"
                    value={validation?.reason || ''}
                    onChange={(e) => handleReasonChange(competitor.id, e.target.value)}
                    disabled={isSubmitting}
                    className="competitor-validation__reason-input"
                  />
                </div>
              )}
            </div>
          );
        })}

        {competitors.length > maxVisible && (
          <div className="competitor-validation__more">
            +{competitors.length - maxVisible} more competitors
          </div>
        )}
      </div>

      {/* Missing Competitors Section */}
      <div className="competitor-validation__missing">
        <h4 className="competitor-validation__missing-title">
          Missing Competitors
          <button
            type="button"
            className="competitor-validation__add-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={isSubmitting}
          >
            {showAddForm ? '- Cancel' : '+ Add'}
          </button>
        </h4>

        {/* List of added missing competitors */}
        {missingCompetitors.length > 0 && (
          <ul className="competitor-validation__missing-list">
            {missingCompetitors.map((comp, index) => (
              <li key={index} className="competitor-validation__missing-item">
                <span>{comp.name}</span>
                {comp.domain && <span className="competitor-validation__domain">{comp.domain}</span>}
                <button
                  type="button"
                  className="competitor-validation__remove-btn"
                  onClick={() => handleRemoveMissing(index)}
                  disabled={isSubmitting}
                  aria-label={`Remove ${comp.name}`}
                >
                  <XIcon />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add competitor form */}
        {showAddForm && (
          <div className="competitor-validation__add-form">
            <input
              type="text"
              placeholder="Competitor name *"
              value={newCompetitorName}
              onChange={(e) => setNewCompetitorName(e.target.value)}
              disabled={isSubmitting}
              className="competitor-validation__input"
            />
            <input
              type="text"
              placeholder="Domain (optional)"
              value={newCompetitorDomain}
              onChange={(e) => setNewCompetitorDomain(e.target.value)}
              disabled={isSubmitting}
              className="competitor-validation__input"
            />
            <button
              type="button"
              className="competitor-validation__add-confirm"
              onClick={handleAddCompetitor}
              disabled={!newCompetitorName.trim() || isSubmitting}
            >
              Add Competitor
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="competitor-validation__footer">
        <button
          type="button"
          className="competitor-validation__submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : hasChanges ? 'Submit Feedback' : 'Confirm All Correct'}
        </button>
      </div>

      <style jsx>{`
        .competitor-validation {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          background: var(--color-surface, #f8f9fa);
          border-radius: 10px;
        }

        .competitor-validation--submitted {
          background: var(--color-success-bg, #d4edda);
        }

        .competitor-validation__thanks {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px;
          color: var(--color-success, #28a745);
        }

        .competitor-validation__header {
          margin-bottom: 8px;
        }

        .competitor-validation__title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: var(--color-text, #212529);
        }

        .competitor-validation__subtitle {
          font-size: 13px;
          color: var(--color-text-secondary, #6c757d);
          margin: 0;
        }

        .competitor-validation__list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .competitor-validation__item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: white;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .competitor-validation__item--rejected {
          background: var(--color-danger-bg, #fff5f5);
          border-color: var(--color-danger-light, #fec1c1);
        }

        .competitor-validation__item-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .competitor-validation__checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          flex: 1;
        }

        .competitor-validation__checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .competitor-validation__competitor-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .competitor-validation__name {
          font-weight: 500;
          color: var(--color-text, #212529);
        }

        .competitor-validation__domain {
          font-size: 12px;
          color: var(--color-text-secondary, #6c757d);
        }

        .competitor-validation__score {
          font-size: 13px;
          color: var(--color-text-secondary, #6c757d);
          background: var(--color-surface, #f8f9fa);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .competitor-validation__reason {
          margin-left: 28px;
        }

        .competitor-validation__reason-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
          font-size: 13px;
        }

        .competitor-validation__reason-input:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
        }

        .competitor-validation__more {
          text-align: center;
          font-size: 13px;
          color: var(--color-text-secondary, #6c757d);
          padding: 8px;
        }

        .competitor-validation__missing {
          border-top: 1px solid var(--color-border, #dee2e6);
          padding-top: 16px;
        }

        .competitor-validation__missing-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: var(--color-text, #212529);
        }

        .competitor-validation__add-btn {
          padding: 4px 12px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .competitor-validation__add-btn:hover:not(:disabled) {
          background: var(--color-primary-dark, #0056b3);
        }

        .competitor-validation__missing-list {
          list-style: none;
          margin: 0 0 12px 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .competitor-validation__missing-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--color-success-bg, #d4edda);
          border-radius: 6px;
          font-size: 14px;
        }

        .competitor-validation__remove-btn {
          margin-left: auto;
          padding: 4px;
          background: none;
          border: none;
          color: var(--color-danger, #dc3545);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .competitor-validation__add-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: white;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 8px;
        }

        .competitor-validation__input {
          padding: 8px 12px;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: 6px;
          font-size: 14px;
        }

        .competitor-validation__input:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
        }

        .competitor-validation__add-confirm {
          padding: 8px 16px;
          background: var(--color-success, #28a745);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          align-self: flex-start;
        }

        .competitor-validation__add-confirm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .competitor-validation__footer {
          display: flex;
          justify-content: flex-end;
          padding-top: 8px;
        }

        .competitor-validation__submit {
          padding: 10px 20px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .competitor-validation__submit:hover:not(:disabled) {
          background: var(--color-primary-dark, #0056b3);
        }

        .competitor-validation__submit:disabled {
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

// ============================================================================
// EXPORTS
// ============================================================================

export default CompetitorValidation;
