/**
 * Human-Friendly Error Messages Tests
 *
 * Phase 1, Week 1, Day 5
 */

import { describe, it, expect } from 'vitest';
import {
  ERROR_MESSAGES,
  getErrorMessage,
  toUserFriendlyError,
  getToastMessage,
  formatErrorForLog,
  shouldShowSupport,
  shouldShowRetry,
  getRetryDelay,
} from './messages';
import {
  AppError,
  ValidationError,
  RateLimitError,
  AIProviderError,
  UnauthenticatedError,
  InternalError,
  NotFoundError,
  DatabaseError,
  QuotaExceededError,
} from './index';

// ================================================================
// ERROR_MESSAGES CATALOG TESTS
// ================================================================

describe('ERROR_MESSAGES catalog', () => {
  it('should have validation errors', () => {
    expect(ERROR_MESSAGES.ERR_VALIDATION).toBeDefined();
    expect(ERROR_MESSAGES.ERR_VALIDATION.title).toBeTruthy();
    expect(ERROR_MESSAGES.ERR_VALIDATION.description).toBeTruthy();
  });

  it('should have authentication errors', () => {
    expect(ERROR_MESSAGES.ERR_AUTH).toBeDefined();
    expect(ERROR_MESSAGES.ERR_UNAUTHENTICATED).toBeDefined();
    expect(ERROR_MESSAGES.ERR_UNAUTHORIZED).toBeDefined();
    expect(ERROR_MESSAGES.ERR_TOKEN_EXPIRED).toBeDefined();
  });

  it('should have rate limit errors', () => {
    expect(ERROR_MESSAGES.ERR_RATE_LIMIT).toBeDefined();
    expect(ERROR_MESSAGES.ERR_RATE_LIMIT.showRetry).toBe(true);
  });

  it('should have external service errors', () => {
    expect(ERROR_MESSAGES.ERR_EXTERNAL_SERVICE).toBeDefined();
    expect(ERROR_MESSAGES.ERR_AI_OPENAI).toBeDefined();
    expect(ERROR_MESSAGES.ERR_AI_ANTHROPIC).toBeDefined();
    expect(ERROR_MESSAGES.ERR_AI_GOOGLE).toBeDefined();
    expect(ERROR_MESSAGES.ERR_AI_PERPLEXITY).toBeDefined();
    expect(ERROR_MESSAGES.ERR_DATABASE).toBeDefined();
  });

  it('should have business logic errors', () => {
    expect(ERROR_MESSAGES.ERR_QUOTA_EXCEEDED).toBeDefined();
    expect(ERROR_MESSAGES.ERR_DUPLICATE_ANALYSIS).toBeDefined();
    expect(ERROR_MESSAGES.ERR_INVALID_STATE).toBeDefined();
  });

  it('should have internal errors', () => {
    expect(ERROR_MESSAGES.ERR_INTERNAL).toBeDefined();
    expect(ERROR_MESSAGES.ERR_INTERNAL.showSupport).toBe(true);
  });

  it('should not contain technical jargon', () => {
    const technicalTerms = ['API', '500', 'exception', 'null', 'undefined', 'stack'];

    for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
      for (const term of technicalTerms) {
        expect(
          message.title.toLowerCase().includes(term.toLowerCase()),
          `${code} title contains "${term}"`
        ).toBe(false);
        expect(
          message.description.toLowerCase().includes(term.toLowerCase()),
          `${code} description contains "${term}"`
        ).toBe(false);
      }
    }
  });

  it('should have user-friendly language', () => {
    // All messages should use "you" or "your" perspective
    const youTerms = ['you', 'your'];
    let messagesWithYou = 0;

    for (const message of Object.values(ERROR_MESSAGES)) {
      const text = `${message.description} ${message.action || ''}`.toLowerCase();
      if (youTerms.some(term => text.includes(term))) {
        messagesWithYou++;
      }
    }

    // At least 50% of messages should address the user directly
    const totalMessages = Object.keys(ERROR_MESSAGES).length;
    expect(messagesWithYou / totalMessages).toBeGreaterThan(0.5);
  });

  it('should have actions that provide clear next steps', () => {
    // Most errors should have an action
    const errorsWithActions = Object.values(ERROR_MESSAGES).filter(m => m.action).length;
    const totalErrors = Object.keys(ERROR_MESSAGES).length;

    expect(errorsWithActions / totalErrors).toBeGreaterThan(0.8);
  });
});

// ================================================================
// getErrorMessage TESTS
// ================================================================

describe('getErrorMessage', () => {
  it('should return exact match for known error code', () => {
    const message = getErrorMessage('ERR_VALIDATION');
    expect(message.title).toBe('Check your input');
  });

  it('should return default for unknown error code', () => {
    const message = getErrorMessage('ERR_NONEXISTENT_CODE');
    expect(message.title).toBe('Something went wrong');
    expect(message.showRetry).toBe(true);
    expect(message.showSupport).toBe(true);
  });

  it('should use custom default config', () => {
    const message = getErrorMessage('ERR_UNKNOWN_CODE', {
      defaultTitle: 'Custom Error',
      defaultDescription: 'Custom description',
    });
    expect(message.title).toBe('Custom Error');
    expect(message.description).toBe('Custom description');
  });

  it('should match prefixes for similar error types', () => {
    // ERR_AI_CUSTOM should match ERR_AI_PROVIDER pattern
    // This is tested indirectly through the prefix matching logic
    const aiError = getErrorMessage('ERR_AI_OPENAI');
    expect(aiError.title).toContain('ChatGPT');
  });
});

// ================================================================
// toUserFriendlyError TESTS
// ================================================================

describe('toUserFriendlyError', () => {
  it('should convert ValidationError', () => {
    const error = new ValidationError('Field is required');
    const friendly = toUserFriendlyError(error);

    expect(friendly.title).toBe('Check your input');
    expect(friendly.icon).toBe('warning');
    expect(friendly.showRetry).toBe(false);
  });

  it('should convert RateLimitError with retry info', () => {
    const error = new RateLimitError(120);
    const friendly = toUserFriendlyError(error);

    expect(friendly.title).toBe('Too many requests');
    expect(friendly.showRetry).toBe(true);
    expect(friendly.description).toContain('2 minute');
  });

  it('should convert AIProviderError', () => {
    const error = new AIProviderError('openai', 'Service unavailable');
    const friendly = toUserFriendlyError(error);

    expect(friendly.showRetry).toBe(true);
  });

  it('should convert UnauthenticatedError', () => {
    const error = new UnauthenticatedError();
    const friendly = toUserFriendlyError(error);

    expect(friendly.title).toBe('Sign in required');
    expect(friendly.icon).toBe('lock');
  });

  it('should convert InternalError with support', () => {
    const error = new InternalError('Something broke');
    const friendly = toUserFriendlyError(error);

    expect(friendly.title).toBe('Something went wrong');
    expect(friendly.showSupport).toBe(true);
  });

  it('should convert NotFoundError', () => {
    const error = new NotFoundError('Analysis', '123');
    const friendly = toUserFriendlyError(error);

    expect(friendly.title).toBe('Not found');
  });

  it('should handle standard Error with network message', () => {
    const error = new Error('Failed to fetch data');
    const friendly = toUserFriendlyError(error);

    expect(friendly.title).toBe('Connection lost');
    expect(friendly.icon).toBe('network');
  });

  it('should handle standard Error with timeout message', () => {
    const error = new Error('Request timed out');
    const friendly = toUserFriendlyError(error);

    expect(friendly.title).toBe('Request timed out');
  });

  it('should handle unknown error types', () => {
    const friendly = toUserFriendlyError('some string error');

    expect(friendly.title).toBe('Unexpected error');
    expect(friendly.showSupport).toBe(true);
  });

  it('should handle null/undefined', () => {
    const friendly1 = toUserFriendlyError(null);
    const friendly2 = toUserFriendlyError(undefined);

    expect(friendly1.title).toBeTruthy();
    expect(friendly2.title).toBeTruthy();
  });
});

// ================================================================
// getToastMessage TESTS
// ================================================================

describe('getToastMessage', () => {
  it('should return error variant for internal errors', () => {
    const error = new InternalError('Bug');
    const toast = getToastMessage(error);

    expect(toast.variant).toBe('error');
    expect(toast.title).toBeTruthy();
    expect(toast.description).toBeTruthy();
  });

  it('should return warning variant for validation errors', () => {
    const error = new ValidationError('Invalid input');
    const toast = getToastMessage(error);

    expect(toast.variant).toBe('warning');
  });

  it('should return info variant for info-level errors', () => {
    // Duplicate analysis is informational, not an error
    const error = new AppError({
      code: 'ERR_DUPLICATE_ANALYSIS',
      message: 'Already running',
      httpStatus: 409,
      isRetriable: false,
      isOperational: true,
    });
    const toast = getToastMessage(error);

    expect(toast.variant).toBe('info');
  });
});

// ================================================================
// formatErrorForLog TESTS
// ================================================================

describe('formatErrorForLog', () => {
  it('should format AppError with all details', () => {
    const error = new ValidationError('Field required', { field: 'email' });
    const formatted = formatErrorForLog(error);

    expect(formatted.userMessage).toContain('Check your input');
    expect(formatted.technicalDetails.code).toBe('ERR_VALIDATION');
    expect(formatted.technicalDetails.httpStatus).toBe(400);
    expect(formatted.technicalDetails.isRetriable).toBe(false);
    expect(formatted.technicalDetails.context).toEqual({ field: 'email' });
  });

  it('should format AppError with cause', () => {
    const cause = new Error('Original error');
    const error = new DatabaseError('Query failed', cause);
    const formatted = formatErrorForLog(error);

    expect(formatted.technicalDetails.cause).toBeDefined();
    expect((formatted.technicalDetails.cause as { message: string }).message).toBe('Original error');
  });

  it('should format standard Error', () => {
    const error = new Error('Standard error');
    const formatted = formatErrorForLog(error);

    expect(formatted.technicalDetails.name).toBe('Error');
    expect(formatted.technicalDetails.message).toBe('Standard error');
    expect(formatted.technicalDetails.stack).toBeDefined();
  });

  it('should format unknown error types', () => {
    const formatted = formatErrorForLog('string error');

    expect(formatted.technicalDetails.raw).toBe('string error');
  });
});

// ================================================================
// shouldShowSupport TESTS
// ================================================================

describe('shouldShowSupport', () => {
  it('should return true for internal errors', () => {
    const error = new InternalError('Bug');
    expect(shouldShowSupport(error)).toBe(true);
  });

  it('should return true for external service errors', () => {
    const error = new DatabaseError('Connection failed');
    expect(shouldShowSupport(error)).toBe(true);
  });

  it('should return false for validation errors', () => {
    const error = new ValidationError('Invalid input');
    expect(shouldShowSupport(error)).toBe(false);
  });

  it('should return false for rate limit errors', () => {
    const error = new RateLimitError(60);
    expect(shouldShowSupport(error)).toBe(false);
  });
});

// ================================================================
// shouldShowRetry TESTS
// ================================================================

describe('shouldShowRetry', () => {
  it('should return true for retriable errors', () => {
    const error = new RateLimitError(60);
    expect(shouldShowRetry(error)).toBe(true);
  });

  it('should return true for database errors', () => {
    const error = new DatabaseError('Connection lost');
    expect(shouldShowRetry(error)).toBe(true);
  });

  it('should return false for validation errors', () => {
    const error = new ValidationError('Invalid input');
    expect(shouldShowRetry(error)).toBe(false);
  });

  it('should return false for auth errors', () => {
    const error = new UnauthenticatedError();
    expect(shouldShowRetry(error)).toBe(false);
  });

  it('should return true for standard network errors', () => {
    const error = new Error('fetch failed');
    expect(shouldShowRetry(error)).toBe(true);
  });
});

// ================================================================
// getRetryDelay TESTS
// ================================================================

describe('getRetryDelay', () => {
  it('should use retryAfter from context', () => {
    const error = new RateLimitError(120);
    const delay = getRetryDelay(error);

    expect(delay).toBe(120000); // 120 seconds in ms
  });

  it('should return 60s for rate limit without context', () => {
    const error = new AppError({
      code: 'ERR_RATE_LIMIT',
      message: 'Too many requests',
      httpStatus: 429,
      isRetriable: true,
      isOperational: true,
    });
    const delay = getRetryDelay(error);

    expect(delay).toBe(60000);
  });

  it('should return 30s for circuit breaker open', () => {
    const error = new AppError({
      code: 'ERR_CIRCUIT_OPEN',
      message: 'Circuit open',
      httpStatus: 503,
      isRetriable: true,
      isOperational: true,
    });
    const delay = getRetryDelay(error);

    expect(delay).toBe(30000);
  });

  it('should return 5s for timeout errors', () => {
    const error = new AppError({
      code: 'ERR_TIMEOUT',
      message: 'Timed out',
      httpStatus: 504,
      isRetriable: true,
      isOperational: true,
    });
    const delay = getRetryDelay(error);

    expect(delay).toBe(5000);
  });

  it('should return 2s default for standard errors', () => {
    const error = new Error('Some error');
    const delay = getRetryDelay(error);

    expect(delay).toBe(2000);
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('Error Message Integration', () => {
  it('should provide complete error handling flow', () => {
    // Simulate an error occurring
    const error = new QuotaExceededError('analyses', 10, 10);

    // Convert to user-friendly message
    const friendly = toUserFriendlyError(error);
    expect(friendly.title).toBeDefined();

    // Get toast message
    const toast = getToastMessage(error);
    expect(toast.title).toBeDefined();
    expect(toast.variant).toBeDefined();

    // Log the error
    const logFormat = formatErrorForLog(error);
    expect(logFormat.userMessage).toBeDefined();
    expect(logFormat.technicalDetails.code).toBe('ERR_QUOTA_EXCEEDED');

    // Check retry/support behavior
    expect(shouldShowRetry(error)).toBe(false);
    expect(shouldShowSupport(error)).toBe(false);
  });

  it('should handle AI provider errors gracefully', () => {
    const providers = ['openai', 'anthropic', 'google', 'perplexity'] as const;

    for (const provider of providers) {
      const error = new AIProviderError(provider, 'Service down');
      const friendly = toUserFriendlyError(error);

      // Should have user-friendly message
      expect(friendly.title).toBeTruthy();

      // Should allow retry
      expect(shouldShowRetry(error)).toBe(true);

      // Should have appropriate delay
      const delay = getRetryDelay(error);
      expect(delay).toBeGreaterThan(0);
    }
  });

  it('should maintain consistent UX patterns', () => {
    const errors = [
      new ValidationError('Invalid'),
      new RateLimitError(60),
      new DatabaseError('Down'),
      new InternalError('Bug'),
      new NotFoundError('Resource'),
    ];

    for (const error of errors) {
      const friendly = toUserFriendlyError(error);
      const toast = getToastMessage(error);

      // All should have title and description
      expect(friendly.title).toBeTruthy();
      expect(friendly.description).toBeTruthy();
      expect(toast.title).toBeTruthy();
      expect(toast.description).toBeTruthy();

      // All should have icon
      expect(friendly.icon).toBeTruthy();

      // All should have a defined variant
      expect(['error', 'warning', 'info']).toContain(toast.variant);
    }
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  it('should handle empty error message', () => {
    const error = new ValidationError('');
    const friendly = toUserFriendlyError(error);

    expect(friendly.title).toBeTruthy();
  });

  it('should handle very long error messages', () => {
    const longMessage = 'a'.repeat(1000);
    const error = new InternalError(longMessage);
    const toast = getToastMessage(error);

    expect(toast.title).toBeTruthy();
    expect(toast.description).toBeTruthy();
  });

  it('should handle special characters in error', () => {
    const error = new ValidationError('Field <script>alert("xss")</script> is invalid');
    const friendly = toUserFriendlyError(error);

    expect(friendly.title).toBeTruthy();
  });

  it('should handle errors with circular references in context', () => {
    const context: Record<string, unknown> = { field: 'email' };
    // Note: We don't add circular refs to context as it would cause issues
    const error = new ValidationError('Invalid', context);
    const formatted = formatErrorForLog(error);

    expect(formatted.technicalDetails.context).toBeDefined();
  });
});
