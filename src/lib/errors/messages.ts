/**
 * Human-Friendly Error Messages
 *
 * Phase 1, Week 1, Day 5
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.31 & UX-WRITING-GUIDE.md
 *
 * Maps error codes to user-friendly messages that follow our UX guidelines:
 * 1. What happened (brief, non-technical)
 * 2. Why it happened (if helpful)
 * 3. What to do next (actionable)
 */

import { AppError, isAppError } from './index';

// ================================================================
// TYPES
// ================================================================

export interface UserFriendlyError {
  /** Short title for the error */
  title: string;
  /** Longer description with context */
  description: string;
  /** Suggested action for the user */
  action?: string;
  /** Icon name or emoji for UI */
  icon?: 'error' | 'warning' | 'info' | 'network' | 'lock' | 'clock';
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Whether to show contact support link */
  showSupport?: boolean;
}

export interface ErrorMessageConfig {
  /** Default title if no specific mapping */
  defaultTitle?: string;
  /** Default description if no specific mapping */
  defaultDescription?: string;
  /** Support email or URL */
  supportLink?: string;
}

// ================================================================
// ERROR MESSAGE CATALOG
// ================================================================

/**
 * Comprehensive mapping of error codes to user-friendly messages
 * Following UX Writing Guide principles:
 * - Never blame the user
 * - Avoid technical jargon
 * - Always provide a next step
 * - Be empathetic but brief
 */
export const ERROR_MESSAGES: Record<string, UserFriendlyError> = {
  // ================================================================
  // VALIDATION ERRORS
  // ================================================================
  ERR_VALIDATION: {
    title: "Check your input",
    description: "Some information doesn't look right. Please review and try again.",
    action: "Review the highlighted fields",
    icon: 'warning',
    showRetry: false,
  },

  ERR_SCHEMA_VALIDATION: {
    title: "Invalid data format",
    description: "The data you provided doesn't match our expected format.",
    action: "Check the required fields and try again",
    icon: 'warning',
    showRetry: false,
  },

  ERR_URL_INVALID: {
    title: "Invalid URL",
    description: "This doesn't look like a valid URL. Try entering a complete address like https://example.com",
    action: "Enter a valid URL starting with https://",
    icon: 'warning',
    showRetry: false,
  },

  ERR_PAYLOAD_TOO_LARGE: {
    title: "File too large",
    description: "The data you're sending is larger than we can process.",
    action: "Try with a smaller file or less data",
    icon: 'warning',
    showRetry: false,
  },

  // ================================================================
  // AUTHENTICATION ERRORS
  // ================================================================
  ERR_AUTH: {
    title: "Sign in required",
    description: "You need to be signed in to continue.",
    action: "Sign in to your account",
    icon: 'lock',
    showRetry: false,
  },

  ERR_UNAUTHENTICATED: {
    title: "Sign in required",
    description: "Please sign in to access this feature.",
    action: "Sign in or create an account",
    icon: 'lock',
    showRetry: false,
  },

  ERR_UNAUTHORIZED: {
    title: "Access denied",
    description: "You don't have permission to access this feature.",
    action: "Contact your account owner for access",
    icon: 'lock',
    showRetry: false,
    showSupport: true,
  },

  ERR_TOKEN_EXPIRED: {
    title: "Session expired",
    description: "Your session has timed out for security reasons.",
    action: "Sign in again to continue",
    icon: 'clock',
    showRetry: false,
  },

  // ================================================================
  // RATE LIMIT ERRORS
  // ================================================================
  ERR_RATE_LIMIT: {
    title: "Too many requests",
    description: "You've hit the request limit. This helps us keep the service fast for everyone.",
    action: "Wait a moment and try again",
    icon: 'clock',
    showRetry: true,
  },

  ERR_DAILY_LIMIT: {
    title: "Daily limit reached",
    description: "You've used all your analyses for today.",
    action: "Upgrade for unlimited analyses or wait until tomorrow",
    icon: 'clock',
    showRetry: false,
  },

  // ================================================================
  // EXTERNAL SERVICE ERRORS
  // ================================================================
  ERR_EXTERNAL_SERVICE: {
    title: "Service temporarily unavailable",
    description: "One of our services is having issues. This usually fixes itself quickly.",
    action: "Try again in a few moments",
    icon: 'network',
    showRetry: true,
    showSupport: true,
  },

  ERR_AI_PROVIDER: {
    title: "AI service unavailable",
    description: "We couldn't connect to one of our AI providers. Your analysis may be partial.",
    action: "Refresh to try again",
    icon: 'network',
    showRetry: true,
  },

  ERR_AI_OPENAI: {
    title: "ChatGPT is temporarily unavailable",
    description: "We're having trouble connecting to ChatGPT right now.",
    action: "Your score may be partial. Try again later for a complete analysis.",
    icon: 'network',
    showRetry: true,
  },

  ERR_AI_ANTHROPIC: {
    title: "Claude is temporarily unavailable",
    description: "We're having trouble connecting to Claude right now.",
    action: "Your score may be partial. Try again later for a complete analysis.",
    icon: 'network',
    showRetry: true,
  },

  ERR_AI_GOOGLE: {
    title: "Gemini is temporarily unavailable",
    description: "We're having trouble connecting to Gemini right now.",
    action: "Your score may be partial. Try again later for a complete analysis.",
    icon: 'network',
    showRetry: true,
  },

  ERR_AI_PERPLEXITY: {
    title: "Perplexity is temporarily unavailable",
    description: "We're having trouble connecting to Perplexity right now.",
    action: "Your score may be partial. Try again later for a complete analysis.",
    icon: 'network',
    showRetry: true,
  },

  ERR_DATABASE: {
    title: "Unable to save data",
    description: "We couldn't save your data right now. Don't worry, nothing was lost.",
    action: "Try again in a moment",
    icon: 'network',
    showRetry: true,
    showSupport: true,
  },

  ERR_CACHE: {
    title: "Temporary loading issue",
    description: "We're having a minor issue loading cached data.",
    action: "Refresh to load fresh data",
    icon: 'network',
    showRetry: true,
  },

  ERR_WEBSITE_UNREACHABLE: {
    title: "Couldn't reach the website",
    description: "We couldn't connect to this website. It may be down or blocking our access.",
    action: "Check the URL and try again, or try a different page",
    icon: 'network',
    showRetry: true,
  },

  ERR_WEBSITE_BLOCKED: {
    title: "Website blocked our analysis",
    description: "This website is blocking automated access.",
    action: "Try analyzing your homepage instead, or contact us if this continues",
    icon: 'warning',
    showRetry: false,
    showSupport: true,
  },

  // ================================================================
  // BUSINESS LOGIC ERRORS
  // ================================================================
  ERR_QUOTA_EXCEEDED: {
    title: "Usage limit reached",
    description: "You've reached your plan's limit for this feature.",
    action: "Upgrade your plan for unlimited access",
    icon: 'warning',
    showRetry: false,
  },

  ERR_DUPLICATE_ANALYSIS: {
    title: "Analysis already in progress",
    description: "We're already analyzing this URL. You'll see results soon.",
    action: "Wait for the current analysis to complete",
    icon: 'info',
    showRetry: false,
  },

  ERR_INVALID_STATE: {
    title: "Action not available",
    description: "This action isn't available right now.",
    action: "Refresh and try again",
    icon: 'warning',
    showRetry: true,
  },

  ERR_ANALYSIS_FAILED: {
    title: "Analysis couldn't complete",
    description: "We ran into issues analyzing this URL.",
    action: "Try a different URL or contact us if this persists",
    icon: 'error',
    showRetry: true,
    showSupport: true,
  },

  // ================================================================
  // NOT FOUND ERRORS
  // ================================================================
  ERR_NOT_FOUND: {
    title: "Not found",
    description: "We couldn't find what you're looking for.",
    action: "Check the URL or go back to the dashboard",
    icon: 'warning',
    showRetry: false,
  },

  ERR_ANALYSIS_NOT_FOUND: {
    title: "Analysis not found",
    description: "This analysis doesn't exist or may have expired.",
    action: "Run a new analysis",
    icon: 'warning',
    showRetry: false,
  },

  ERR_USER_NOT_FOUND: {
    title: "Account not found",
    description: "We couldn't find an account with that information.",
    action: "Check your email or create a new account",
    icon: 'warning',
    showRetry: false,
  },

  // ================================================================
  // NETWORK ERRORS
  // ================================================================
  ERR_NETWORK: {
    title: "Connection lost",
    description: "Check your internet connection and try again.",
    action: "Make sure you're connected to the internet",
    icon: 'network',
    showRetry: true,
  },

  ERR_TIMEOUT: {
    title: "Request timed out",
    description: "This is taking longer than expected.",
    action: "Try again or check your connection",
    icon: 'clock',
    showRetry: true,
  },

  // ================================================================
  // INTERNAL ERRORS
  // ================================================================
  ERR_INTERNAL: {
    title: "Something went wrong",
    description: "We're looking into it. This is on our end, not yours.",
    action: "Try again or contact support if it continues",
    icon: 'error',
    showRetry: true,
    showSupport: true,
  },

  ERR_UNKNOWN: {
    title: "Unexpected error",
    description: "Something unexpected happened.",
    action: "Try again or contact support",
    icon: 'error',
    showRetry: true,
    showSupport: true,
  },

  // ================================================================
  // PAYMENT/SUBSCRIPTION ERRORS
  // ================================================================
  ERR_PAYMENT_FAILED: {
    title: "Payment failed",
    description: "We couldn't process your payment.",
    action: "Check your card details and try again",
    icon: 'error',
    showRetry: true,
  },

  ERR_SUBSCRIPTION_EXPIRED: {
    title: "Subscription expired",
    description: "Your subscription has ended.",
    action: "Renew your subscription to continue",
    icon: 'warning',
    showRetry: false,
  },

  ERR_SUBSCRIPTION_CANCELLED: {
    title: "Subscription cancelled",
    description: "Your subscription has been cancelled.",
    action: "Resubscribe to access premium features",
    icon: 'warning',
    showRetry: false,
  },

  // ================================================================
  // SECURITY ERRORS
  // ================================================================
  ERR_PROMPT_INJECTION: {
    title: "Invalid input detected",
    description: "Your input contains patterns we can't process for security reasons.",
    action: "Try rephrasing your request",
    icon: 'warning',
    showRetry: false,
  },

  ERR_CSRF: {
    title: "Security check failed",
    description: "This request couldn't be verified for security reasons.",
    action: "Refresh the page and try again",
    icon: 'lock',
    showRetry: true,
  },

  ERR_SUSPICIOUS_ACTIVITY: {
    title: "Account temporarily locked",
    description: "We've detected unusual activity on your account.",
    action: "Contact support to unlock your account",
    icon: 'lock',
    showRetry: false,
    showSupport: true,
  },

  // ================================================================
  // CIRCUIT BREAKER ERRORS
  // ================================================================
  ERR_CIRCUIT_OPEN: {
    title: "Service temporarily paused",
    description: "We've temporarily paused this feature to investigate an issue.",
    action: "Try again in a few minutes",
    icon: 'clock',
    showRetry: true,
  },

  ERR_CIRCUIT_HALF_OPEN: {
    title: "Service recovering",
    description: "We're testing if this service is back online.",
    action: "Try again shortly",
    icon: 'clock',
    showRetry: true,
  },
};

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

const DEFAULT_CONFIG: ErrorMessageConfig = {
  defaultTitle: "Something went wrong",
  defaultDescription: "An unexpected error occurred. Please try again.",
  supportLink: "mailto:support@vectorialdata.com",
};

/**
 * Get user-friendly error message from an error code
 */
export function getErrorMessage(
  code: string,
  config: ErrorMessageConfig = {}
): UserFriendlyError {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Try exact match
  if (ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // Try prefix matching (e.g., ERR_AI_OPENAI matches ERR_AI_PROVIDER)
  const prefixes = ['ERR_AI_', 'ERR_WEBSITE_', 'ERR_PAYMENT_', 'ERR_SUBSCRIPTION_'];
  for (const prefix of prefixes) {
    if (code.startsWith(prefix)) {
      const genericCode = prefix.slice(0, -1); // Remove trailing underscore
      if (ERROR_MESSAGES[genericCode]) {
        return ERROR_MESSAGES[genericCode];
      }
    }
  }

  // Return default error message
  return {
    title: mergedConfig.defaultTitle!,
    description: mergedConfig.defaultDescription!,
    icon: 'error',
    showRetry: true,
    showSupport: true,
  };
}

/**
 * Convert an AppError to a user-friendly error
 */
export function toUserFriendlyError(
  error: AppError | Error | unknown,
  config: ErrorMessageConfig = {}
): UserFriendlyError {
  // Handle AppError
  if (isAppError(error)) {
    const message = getErrorMessage(error.code, config);

    // Add retry hint if error is retriable
    if (error.isRetriable && !message.showRetry) {
      return { ...message, showRetry: true };
    }

    // Add context-specific info if available
    if (error.context) {
      // Customize message based on context
      if (error.context.retryAfter && typeof error.context.retryAfter === 'number') {
        const minutes = Math.ceil((error.context.retryAfter as number) / 60);
        return {
          ...message,
          description: `${message.description} You can try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        };
      }
    }

    return message;
  }

  // Handle standard Error
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return getErrorMessage('ERR_NETWORK', config);
    }

    // Check for timeout errors
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return getErrorMessage('ERR_TIMEOUT', config);
    }
  }

  // Default fallback
  return getErrorMessage('ERR_UNKNOWN', config);
}

/**
 * Get a concise error message for toasts/notifications
 */
export function getToastMessage(error: AppError | Error | unknown): {
  title: string;
  description: string;
  variant: 'error' | 'warning' | 'info';
} {
  const friendly = toUserFriendlyError(error);

  let variant: 'error' | 'warning' | 'info' = 'error';
  if (friendly.icon === 'warning') variant = 'warning';
  if (friendly.icon === 'info') variant = 'info';

  return {
    title: friendly.title,
    description: friendly.description,
    variant,
  };
}

/**
 * Format error for logging (includes technical details)
 */
export function formatErrorForLog(error: AppError | Error | unknown): {
  userMessage: string;
  technicalDetails: Record<string, unknown>;
} {
  const friendly = toUserFriendlyError(error);

  const technicalDetails: Record<string, unknown> = {};

  if (isAppError(error)) {
    technicalDetails.code = error.code;
    technicalDetails.httpStatus = error.httpStatus;
    technicalDetails.isRetriable = error.isRetriable;
    technicalDetails.isOperational = error.isOperational;
    technicalDetails.context = error.context;
    technicalDetails.stack = error.stack;
    if (error.cause) {
      technicalDetails.cause = {
        name: error.cause.name,
        message: error.cause.message,
        stack: error.cause.stack,
      };
    }
  } else if (error instanceof Error) {
    technicalDetails.name = error.name;
    technicalDetails.message = error.message;
    technicalDetails.stack = error.stack;
  } else {
    technicalDetails.raw = String(error);
  }

  return {
    userMessage: `${friendly.title}: ${friendly.description}`,
    technicalDetails,
  };
}

/**
 * Check if error should show support contact
 */
export function shouldShowSupport(error: AppError | Error | unknown): boolean {
  const friendly = toUserFriendlyError(error);
  return friendly.showSupport ?? false;
}

/**
 * Check if error should show retry button
 */
export function shouldShowRetry(error: AppError | Error | unknown): boolean {
  // If it's an AppError, check isRetriable first
  if (isAppError(error)) {
    return error.isRetriable;
  }

  const friendly = toUserFriendlyError(error);
  return friendly.showRetry ?? false;
}

/**
 * Get suggested retry delay in milliseconds
 */
export function getRetryDelay(error: AppError | Error | unknown): number {
  if (isAppError(error) && error.context?.retryAfter) {
    return (error.context.retryAfter as number) * 1000;
  }

  // Default delays based on error type
  if (isAppError(error)) {
    switch (error.code) {
      case 'ERR_RATE_LIMIT':
        return 60000; // 1 minute
      case 'ERR_CIRCUIT_OPEN':
        return 30000; // 30 seconds
      case 'ERR_TIMEOUT':
        return 5000; // 5 seconds
      default:
        return 2000; // 2 seconds
    }
  }

  return 2000; // Default 2 seconds
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  ERROR_MESSAGES,
  getErrorMessage,
  toUserFriendlyError,
  getToastMessage,
  formatErrorForLog,
  shouldShowSupport,
  shouldShowRetry,
  getRetryDelay,
};
