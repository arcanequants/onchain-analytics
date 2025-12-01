/**
 * Structured Logger - JSON Logging with Redaction
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.120
 *
 * Provides structured JSON logging with:
 * - Automatic context injection from AsyncLocalStorage
 * - Sensitive data redaction
 * - Child loggers for scoped context
 * - Log level filtering
 */

import { getLogContext } from '../context';

// ================================================================
// TYPES
// ================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogFields {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  environment: string;
  version: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface LoggerOptions {
  service?: string;
  environment?: string;
  version?: string;
  minLevel?: LogLevel;
  redactKeys?: string[];
}

// ================================================================
// CONSTANTS
// ================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const DEFAULT_REDACT_KEYS = [
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'creditCard',
  'credit_card',
  'ssn',
  'privateKey',
  'private_key',
];

// ================================================================
// REDACTION
// ================================================================

/**
 * Redact sensitive values from an object
 */
function redact(obj: unknown, redactKeys: string[]): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, redactKeys));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const shouldRedact = redactKeys.some((k) => lowerKey.includes(k.toLowerCase()));

    if (shouldRedact) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redact(value, redactKeys);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ================================================================
// LOGGER CLASS
// ================================================================

export class Logger {
  private readonly service: string;
  private readonly environment: string;
  private readonly version: string;
  private readonly minLevel: LogLevel;
  private readonly redactKeys: string[];
  private readonly baseFields: LogFields;

  constructor(options: LoggerOptions = {}, baseFields: LogFields = {}) {
    this.service = options.service || process.env.SERVICE_NAME || 'ai-perception';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.version = options.version || process.env.APP_VERSION || '1.0.0';
    this.minLevel = options.minLevel || (this.environment === 'production' ? 'info' : 'debug');
    this.redactKeys = [...DEFAULT_REDACT_KEYS, ...(options.redactKeys || [])];
    this.baseFields = baseFields;
  }

  /**
   * Create a child logger with additional base fields
   */
  child(fields: LogFields): Logger {
    return new Logger(
      {
        service: this.service,
        environment: this.environment,
        version: this.version,
        minLevel: this.minLevel,
        redactKeys: this.redactKeys,
      },
      { ...this.baseFields, ...fields }
    );
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  /**
   * Format and output a log entry
   */
  private log(level: LogLevel, message: string, fields?: LogFields): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // Get context from AsyncLocalStorage
    const contextFields = getLogContext();

    // Build the log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      environment: this.environment,
      version: this.version,
      ...contextFields,
      ...this.baseFields,
      ...(fields ? (redact(fields, this.redactKeys) as LogFields) : {}),
    };

    // Output as JSON
    const output = JSON.stringify(entry);

    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
      case 'fatal':
        console.error(output);
        break;
    }
  }

  /**
   * Log at debug level
   */
  debug(message: string, fields?: LogFields): void {
    this.log('debug', message, fields);
  }

  /**
   * Log at info level
   */
  info(message: string, fields?: LogFields): void {
    this.log('info', message, fields);
  }

  /**
   * Log at warn level
   */
  warn(message: string, fields?: LogFields): void {
    this.log('warn', message, fields);
  }

  /**
   * Log at error level
   */
  error(message: string, fields?: LogFields): void;
  error(message: string, error: Error, fields?: LogFields): void;
  error(message: string, errorOrFields?: Error | LogFields, maybeFields?: LogFields): void {
    let fields: LogFields = {};

    if (errorOrFields instanceof Error) {
      fields = {
        error: {
          name: errorOrFields.name,
          message: errorOrFields.message,
          stack: errorOrFields.stack,
        },
        ...maybeFields,
      };
    } else if (errorOrFields) {
      fields = errorOrFields;
    }

    this.log('error', message, fields);
  }

  /**
   * Log at fatal level (unrecoverable errors)
   */
  fatal(message: string, fields?: LogFields): void;
  fatal(message: string, error: Error, fields?: LogFields): void;
  fatal(message: string, errorOrFields?: Error | LogFields, maybeFields?: LogFields): void {
    let fields: LogFields = {};

    if (errorOrFields instanceof Error) {
      fields = {
        error: {
          name: errorOrFields.name,
          message: errorOrFields.message,
          stack: errorOrFields.stack,
        },
        ...maybeFields,
      };
    } else if (errorOrFields) {
      fields = errorOrFields;
    }

    this.log('fatal', message, fields);
  }

  /**
   * Log the start of an operation
   */
  startOperation(operation: string, fields?: LogFields): void {
    this.info(`Starting ${operation}`, { operation, ...fields });
  }

  /**
   * Log the end of an operation
   */
  endOperation(operation: string, durationMs: number, fields?: LogFields): void {
    this.info(`Completed ${operation}`, { operation, durationMs, ...fields });
  }

  /**
   * Log a failed operation
   */
  failOperation(operation: string, error: Error, fields?: LogFields): void {
    this.error(`Failed ${operation}`, error, { operation, ...fields });
  }

  /**
   * Create a timer for measuring operation duration
   */
  time(operation: string): OperationTimer {
    const startTime = Date.now();
    this.startOperation(operation);

    return {
      success: (fields?: LogFields) => {
        const durationMs = Date.now() - startTime;
        this.endOperation(operation, durationMs, fields);
      },
      failure: (error: Error, fields?: LogFields) => {
        this.failOperation(operation, error, { durationMs: Date.now() - startTime, ...fields });
      },
    };
  }
}

export interface OperationTimer {
  success: (fields?: LogFields) => void;
  failure: (error: Error, fields?: LogFields) => void;
}

// ================================================================
// DEFAULT LOGGER INSTANCE
// ================================================================

export const logger = new Logger();

// ================================================================
// SPECIALIZED LOGGERS
// ================================================================

/**
 * Logger for AI provider operations
 */
export const aiLogger = logger.child({ component: 'ai' });

/**
 * Logger for database operations
 */
export const dbLogger = logger.child({ component: 'database' });

/**
 * Logger for API route handlers
 */
export const apiLogger = logger.child({ component: 'api' });

/**
 * Logger for background jobs
 */
export const jobLogger = logger.child({ component: 'jobs' });

/**
 * Logger for authentication operations
 */
export const authLogger = logger.child({ component: 'auth' });

// ================================================================
// FACTORY FUNCTION
// ================================================================

/**
 * Create a new logger instance with the given name/component
 */
export function createLogger(name: string, options?: Omit<LoggerOptions, 'service'>): Logger {
  return new Logger(options).child({ component: name });
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  Logger,
  logger,
  aiLogger,
  dbLogger,
  apiLogger,
  jobLogger,
  authLogger,
  createLogger,
};
