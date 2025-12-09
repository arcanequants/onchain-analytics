/**
 * Production-Safe Logger
 *
 * RED TEAM AUDIT FIX: LOW-002
 * Replaces console.log with environment-aware logging
 *
 * Features:
 * - Suppresses debug/info logs in production
 * - Structured logging format
 * - Log level filtering
 * - Error tracking integration ready
 * - Performance-aware (no-op in production for debug)
 */

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  error?: Error;
}

export interface LoggerConfig {
  minLevel?: LogLevel;
  enableConsole?: boolean;
  enableStructured?: boolean;
  context?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Default minimum level based on environment
const DEFAULT_MIN_LEVEL: LogLevel = isProduction ? 'warn' : 'debug';

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
  private config: Required<LoggerConfig>;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      minLevel: config.minLevel || DEFAULT_MIN_LEVEL,
      enableConsole: config.enableConsole ?? true,
      enableStructured: config.enableStructured ?? isProduction,
      context: config.context || 'app',
    };
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Format log entry for output
   */
  private formatEntry(entry: LogEntry): string {
    if (this.config.enableStructured) {
      // Structured JSON format for production (good for log aggregation)
      const logObject: Record<string, unknown> = {
        timestamp: entry.timestamp,
        level: entry.level,
        context: entry.context,
        message: entry.message,
      };

      if (entry.data !== undefined) {
        logObject.data = entry.data;
      }

      if (entry.error) {
        logObject.error = {
          name: entry.error.name,
          message: entry.error.message,
          // Only include stack in non-production
          ...((!isProduction && entry.error.stack) ? { stack: entry.error.stack } : {}),
        };
      }

      return JSON.stringify(logObject);
    }

    // Human-readable format for development
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}]`;
    let output = `${prefix} ${entry.message}`;

    if (entry.data) {
      output += '\n' + JSON.stringify(entry.data, null, 2);
    }

    if (entry.error) {
      output += '\n' + entry.error.stack;
    }

    return output;
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const formatted = this.formatEntry(entry);

    switch (entry.level) {
      case 'debug':
        // In production, debug logs are no-ops
        if (!isProduction) {
          console.debug(formatted);
        }
        break;
      case 'info':
        // In production, info logs are suppressed by default
        if (!isProduction || this.config.minLevel === 'info') {
          console.info(formatted);
        }
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        // Errors are logged to console in structured JSON format for log aggregation
        break;
    }
  }

  /**
   * Create a log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.config.context,
      data,
      error,
    };
  }

  /**
   * Log a debug message (suppressed in production)
   */
  debug(message: string, data?: unknown): void {
    if (!this.shouldLog('debug')) return;
    this.output(this.createEntry('debug', message, data));
  }

  /**
   * Log an info message (suppressed in production by default)
   */
  info(message: string, data?: unknown): void {
    if (!this.shouldLog('info')) return;
    this.output(this.createEntry('info', message, data));
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: unknown): void {
    if (!this.shouldLog('warn')) return;
    this.output(this.createEntry('warn', message, data));
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, data?: unknown): void {
    if (!this.shouldLog('error')) return;

    const errorObj = error instanceof Error ? error : undefined;
    const errorData = error instanceof Error ? data : error;

    this.output(this.createEntry('error', message, errorData, errorObj));
  }

  /**
   * Create a child logger with a specific context
   */
  child(context: string): Logger {
    return new Logger({
      ...this.config,
      context: `${this.config.context}:${context}`,
    });
  }

  /**
   * Time an operation
   */
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`${label} completed`, { duration: `${duration}ms` });
    };
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

// Default logger
const defaultLogger = new Logger();

// Pre-configured loggers for common contexts
export const loggers = {
  api: new Logger({ context: 'api' }),
  ai: new Logger({ context: 'ai' }),
  auth: new Logger({ context: 'auth' }),
  db: new Logger({ context: 'db' }),
  security: new Logger({ context: 'security' }),
  cron: new Logger({ context: 'cron' }),
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get a logger for a specific context
 */
export function getLogger(context?: string): Logger {
  if (!context) return defaultLogger;
  return new Logger({ context });
}

/**
 * Quick logging functions using default logger
 */
export const log = {
  debug: (message: string, data?: unknown) => defaultLogger.debug(message, data),
  info: (message: string, data?: unknown) => defaultLogger.info(message, data),
  warn: (message: string, data?: unknown) => defaultLogger.warn(message, data),
  error: (message: string, error?: Error | unknown, data?: unknown) =>
    defaultLogger.error(message, error, data),
};

// ============================================================================
// CONSOLE OVERRIDE (optional, for gradual migration)
// ============================================================================

/**
 * Safe console wrapper that respects production settings
 * Use this when gradually migrating from console.log
 */
export const safeConsole = {
  log: (...args: unknown[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (!isProduction) {
      console.debug(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

// ============================================================================
// EXPORTS
// ============================================================================

export { Logger };
export default defaultLogger;
