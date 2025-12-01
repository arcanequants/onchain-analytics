/**
 * Data Loss Prevention (DLP) Scanner
 * Phase 1, Week 3, Day 5 - CISO Tasks
 *
 * Scans content for sensitive data patterns including:
 * - PII (Personally Identifiable Information)
 * - API keys and secrets
 * - Financial information
 * - Healthcare data (HIPAA)
 */

// ================================================================
// TYPES
// ================================================================

export type SensitiveDataType =
  | 'api_key'
  | 'aws_key'
  | 'github_token'
  | 'stripe_key'
  | 'jwt_token'
  | 'private_key'
  | 'password'
  | 'credit_card'
  | 'ssn'
  | 'email'
  | 'phone'
  | 'ip_address'
  | 'date_of_birth'
  | 'passport'
  | 'drivers_license'
  | 'bank_account'
  | 'routing_number'
  | 'iban'
  | 'medical_record'
  | 'custom';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface DLPPattern {
  name: string;
  type: SensitiveDataType;
  pattern: RegExp;
  severity: Severity;
  description: string;
  validator?: (match: string) => boolean;
}

export interface DLPFinding {
  type: SensitiveDataType;
  severity: Severity;
  pattern: string;
  match: string;
  maskedMatch: string;
  position: {
    start: number;
    end: number;
    line?: number;
    column?: number;
  };
  context?: string;
  confidence: number;
}

export interface DLPScanResult {
  hasFindings: boolean;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  findings: DLPFinding[];
  scannedAt: string;
  scanDurationMs: number;
}

export interface DLPScannerConfig {
  enabledPatterns?: SensitiveDataType[];
  disabledPatterns?: SensitiveDataType[];
  customPatterns?: DLPPattern[];
  includeContext?: boolean;
  contextChars?: number;
  minConfidence?: number;
}

// ================================================================
// DEFAULT PATTERNS
// ================================================================

const DEFAULT_PATTERNS: DLPPattern[] = [
  // API Keys & Secrets
  {
    name: 'Generic API Key',
    type: 'api_key',
    pattern: /(?:api[_-]?key|apikey|api[_-]?secret)['":\s]*[=:]\s*['"]?([a-zA-Z0-9_\-]{20,})/gi,
    severity: 'critical',
    description: 'Generic API key pattern',
  },
  {
    name: 'AWS Access Key',
    type: 'aws_key',
    pattern: /(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}/g,
    severity: 'critical',
    description: 'AWS Access Key ID',
  },
  {
    name: 'AWS Secret Key',
    type: 'aws_key',
    pattern: /(?:aws[_-]?secret[_-]?access[_-]?key|aws[_-]?secret)['":\s]*[=:]\s*['"]?([A-Za-z0-9/+=]{40})/gi,
    severity: 'critical',
    description: 'AWS Secret Access Key',
  },
  {
    name: 'GitHub Token',
    type: 'github_token',
    pattern: /ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g,
    severity: 'critical',
    description: 'GitHub Personal Access Token',
  },
  {
    name: 'Stripe Secret Key',
    type: 'stripe_key',
    pattern: /sk_live_[a-zA-Z0-9]{24,}/g,
    severity: 'critical',
    description: 'Stripe Secret Key (live)',
  },
  {
    name: 'Stripe Test Key',
    type: 'stripe_key',
    pattern: /sk_test_[a-zA-Z0-9]{24,}/g,
    severity: 'high',
    description: 'Stripe Secret Key (test)',
  },
  {
    name: 'JWT Token',
    type: 'jwt_token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: 'high',
    description: 'JSON Web Token',
  },
  {
    name: 'Private Key',
    type: 'private_key',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'critical',
    description: 'Private key in PEM format',
  },
  {
    name: 'Password in URL',
    type: 'password',
    pattern: /(?:https?:\/\/)[^:]+:([^@]{3,})@/gi,
    severity: 'critical',
    description: 'Password embedded in URL',
  },
  {
    name: 'Password Assignment',
    type: 'password',
    pattern: /(?:password|passwd|pwd|secret)['":\s]*[=:]\s*['"]([^'"]{8,})['"]/gi,
    severity: 'high',
    description: 'Password assignment in code',
  },

  // Financial Data
  {
    name: 'Credit Card Number',
    type: 'credit_card',
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    severity: 'critical',
    description: 'Credit card number (Visa, Mastercard, Amex, Discover)',
    validator: (match) => luhnCheck(match),
  },
  {
    name: 'Bank Account Number',
    type: 'bank_account',
    pattern: /\b(?:account[_\s-]?(?:no|num|number)?)['":\s]*[=:]\s*['"]?(\d{8,17})\b/gi,
    severity: 'high',
    description: 'Bank account number',
  },
  {
    name: 'Routing Number',
    type: 'routing_number',
    pattern: /\b(?:routing[_\s-]?(?:no|num|number)?)['":\s]*[=:]\s*['"]?(\d{9})\b/gi,
    severity: 'high',
    description: 'US bank routing number',
  },
  {
    name: 'IBAN',
    type: 'iban',
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4,30}\b/g,
    severity: 'high',
    description: 'International Bank Account Number',
    validator: (match) => validateIBAN(match),
  },

  // PII
  {
    name: 'Social Security Number',
    type: 'ssn',
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    severity: 'critical',
    description: 'US Social Security Number',
    validator: (match) => {
      const clean = match.replace(/[-\s]/g, '');
      // Basic SSN validation
      if (clean.length !== 9) return false;
      if (clean.startsWith('000') || clean.startsWith('666')) return false;
      if (clean.substring(0, 3) === '900') return false;
      return true;
    },
  },
  {
    name: 'Email Address',
    type: 'email',
    pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    severity: 'low',
    description: 'Email address',
  },
  {
    name: 'Phone Number (US)',
    type: 'phone',
    pattern: /\b(?:\+1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    severity: 'medium',
    description: 'US phone number',
  },
  {
    name: 'Phone Number (International)',
    type: 'phone',
    pattern: /(?<!\w)\+[1-9]\d{6,14}(?!\d)/g,
    severity: 'medium',
    description: 'International phone number (E.164)',
  },
  {
    name: 'IP Address',
    type: 'ip_address',
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    severity: 'info',
    description: 'IPv4 address',
  },
  {
    name: 'Date of Birth',
    type: 'date_of_birth',
    pattern: /\b(?:dob|date[_\s]?of[_\s]?birth|birth[_\s]?date)['":\s]*[=:]\s*['"]?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/gi,
    severity: 'medium',
    description: 'Date of birth',
  },
  {
    name: 'Passport Number',
    type: 'passport',
    pattern: /\b(?:passport[_\s]?(?:no|num|number)?)['":\s]*[=:]\s*['"]?([A-Z0-9]{6,12})\b/gi,
    severity: 'high',
    description: 'Passport number',
  },
  {
    name: 'Driver License',
    type: 'drivers_license',
    pattern: /\b(?:driver[_\s]?(?:license|licence)|dl[_\s]?(?:no|num|number)?)['":\s]*[=:]\s*['"]?([A-Z0-9]{5,15})\b/gi,
    severity: 'high',
    description: 'Driver license number',
  },

  // Healthcare (HIPAA)
  {
    name: 'Medical Record Number',
    type: 'medical_record',
    pattern: /\b(?:mrn|medical[_\s]?record[_\s]?(?:no|num|number)?)['":\s]*[=:]\s*['"]?([A-Z0-9]{6,15})\b/gi,
    severity: 'critical',
    description: 'Medical record number',
  },
];

// ================================================================
// VALIDATION HELPERS
// ================================================================

/**
 * Luhn algorithm for credit card validation
 */
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Basic IBAN validation
 */
function validateIBAN(iban: string): boolean {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (clean.length < 15 || clean.length > 34) return false;

  // Move first 4 chars to end
  const rearranged = clean.slice(4) + clean.slice(0, 4);

  // Convert letters to numbers (A=10, B=11, etc.)
  let numericString = '';
  for (const char of rearranged) {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      numericString += (code - 55).toString();
    } else {
      numericString += char;
    }
  }

  // Mod 97 check
  let remainder = 0;
  for (const digit of numericString) {
    remainder = (remainder * 10 + parseInt(digit, 10)) % 97;
  }

  return remainder === 1;
}

/**
 * Mask sensitive data for safe logging
 */
function maskSensitiveData(data: string, type: SensitiveDataType): string {
  const length = data.length;

  switch (type) {
    case 'credit_card':
      return data.slice(0, 4) + '*'.repeat(length - 8) + data.slice(-4);
    case 'ssn':
      return '***-**-' + data.slice(-4).replace(/[-\s]/g, '');
    case 'email':
      const [local, domain] = data.split('@');
      return local[0] + '*'.repeat(local.length - 2) + local.slice(-1) + '@' + domain;
    case 'phone':
      return data.slice(0, 3) + '*'.repeat(length - 6) + data.slice(-3);
    case 'api_key':
    case 'aws_key':
    case 'github_token':
    case 'stripe_key':
    case 'jwt_token':
      return data.slice(0, 8) + '*'.repeat(Math.max(length - 12, 4)) + data.slice(-4);
    case 'private_key':
      return '[PRIVATE KEY REDACTED]';
    case 'password':
      return '*'.repeat(length);
    default:
      if (length <= 4) return '*'.repeat(length);
      return data.slice(0, 2) + '*'.repeat(length - 4) + data.slice(-2);
  }
}

/**
 * Get line and column from position
 */
function getLineAndColumn(
  content: string,
  position: number
): { line: number; column: number } {
  const lines = content.slice(0, position).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

// ================================================================
// DLP SCANNER CLASS
// ================================================================

export class DLPScanner {
  private patterns: DLPPattern[];
  private config: Required<DLPScannerConfig>;

  constructor(config: DLPScannerConfig = {}) {
    this.config = {
      enabledPatterns: config.enabledPatterns || [],
      disabledPatterns: config.disabledPatterns || [],
      customPatterns: config.customPatterns || [],
      includeContext: config.includeContext ?? true,
      contextChars: config.contextChars ?? 50,
      minConfidence: config.minConfidence ?? 0.5,
    };

    this.patterns = this.buildPatternList();
  }

  private buildPatternList(): DLPPattern[] {
    let patterns = [...DEFAULT_PATTERNS, ...this.config.customPatterns];

    // Filter by enabled patterns
    if (this.config.enabledPatterns.length > 0) {
      patterns = patterns.filter((p) =>
        this.config.enabledPatterns.includes(p.type)
      );
    }

    // Filter out disabled patterns
    if (this.config.disabledPatterns.length > 0) {
      patterns = patterns.filter(
        (p) => !this.config.disabledPatterns.includes(p.type)
      );
    }

    return patterns;
  }

  /**
   * Scan content for sensitive data
   */
  scan(content: string): DLPScanResult {
    const startTime = Date.now();
    const findings: DLPFinding[] = [];

    for (const pattern of this.patterns) {
      // Reset regex lastIndex for global patterns
      pattern.pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const matchedText = match[1] || match[0];
        let confidence = 0.8;

        // Run validator if available
        if (pattern.validator) {
          if (!pattern.validator(matchedText)) {
            confidence = 0.3;
          } else {
            confidence = 0.95;
          }
        }

        // Skip low confidence matches
        if (confidence < this.config.minConfidence) {
          continue;
        }

        const position = getLineAndColumn(content, match.index);

        const finding: DLPFinding = {
          type: pattern.type,
          severity: pattern.severity,
          pattern: pattern.name,
          match: matchedText,
          maskedMatch: maskSensitiveData(matchedText, pattern.type),
          position: {
            start: match.index,
            end: match.index + match[0].length,
            line: position.line,
            column: position.column,
          },
          confidence,
        };

        // Add context if enabled
        if (this.config.includeContext) {
          const contextStart = Math.max(0, match.index - this.config.contextChars);
          const contextEnd = Math.min(
            content.length,
            match.index + match[0].length + this.config.contextChars
          );
          finding.context = content.slice(contextStart, contextEnd);
        }

        findings.push(finding);
      }
    }

    // Sort by severity
    findings.sort((a, b) => {
      const severityOrder: Record<Severity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
        info: 4,
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const scanDurationMs = Date.now() - startTime;

    return {
      hasFindings: findings.length > 0,
      totalFindings: findings.length,
      criticalCount: findings.filter((f) => f.severity === 'critical').length,
      highCount: findings.filter((f) => f.severity === 'high').length,
      mediumCount: findings.filter((f) => f.severity === 'medium').length,
      lowCount: findings.filter((f) => f.severity === 'low').length,
      findings,
      scannedAt: new Date().toISOString(),
      scanDurationMs,
    };
  }

  /**
   * Scan multiple pieces of content
   */
  scanMultiple(contents: Array<{ id: string; content: string }>): Map<string, DLPScanResult> {
    const results = new Map<string, DLPScanResult>();

    for (const item of contents) {
      results.set(item.id, this.scan(item.content));
    }

    return results;
  }

  /**
   * Check if content contains any sensitive data
   */
  hasSensitiveData(content: string): boolean {
    const result = this.scan(content);
    return result.hasFindings;
  }

  /**
   * Redact sensitive data from content
   */
  redact(content: string): string {
    const result = this.scan(content);

    if (!result.hasFindings) {
      return content;
    }

    let redacted = content;
    // Sort findings by position descending to avoid offset issues
    const sortedFindings = [...result.findings].sort(
      (a, b) => b.position.start - a.position.start
    );

    for (const finding of sortedFindings) {
      redacted =
        redacted.slice(0, finding.position.start) +
        finding.maskedMatch +
        redacted.slice(finding.position.end);
    }

    return redacted;
  }

  /**
   * Add custom pattern
   */
  addPattern(pattern: DLPPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Get all configured patterns
   */
  getPatterns(): DLPPattern[] {
    return [...this.patterns];
  }

  /**
   * Create a report from scan results
   */
  static generateReport(results: DLPScanResult[]): string {
    const totalFindings = results.reduce((sum, r) => sum + r.totalFindings, 0);
    const criticalCount = results.reduce((sum, r) => sum + r.criticalCount, 0);
    const highCount = results.reduce((sum, r) => sum + r.highCount, 0);

    let report = '# DLP Scan Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Files Scanned:** ${results.length}\n`;
    report += `**Total Findings:** ${totalFindings}\n\n`;

    report += '## Summary by Severity\n\n';
    report += `- Critical: ${criticalCount}\n`;
    report += `- High: ${highCount}\n`;
    report += `- Medium: ${results.reduce((sum, r) => sum + r.mediumCount, 0)}\n`;
    report += `- Low: ${results.reduce((sum, r) => sum + r.lowCount, 0)}\n\n`;

    if (criticalCount > 0 || highCount > 0) {
      report += '## Critical & High Severity Findings\n\n';

      for (const result of results) {
        const importantFindings = result.findings.filter(
          (f) => f.severity === 'critical' || f.severity === 'high'
        );

        for (const finding of importantFindings) {
          report += `### ${finding.pattern}\n`;
          report += `- **Type:** ${finding.type}\n`;
          report += `- **Severity:** ${finding.severity}\n`;
          report += `- **Masked Value:** \`${finding.maskedMatch}\`\n`;
          report += `- **Location:** Line ${finding.position.line}, Column ${finding.position.column}\n`;
          report += `- **Confidence:** ${(finding.confidence * 100).toFixed(0)}%\n\n`;
        }
      }
    }

    return report;
  }
}

// ================================================================
// FACTORY FUNCTION
// ================================================================

/**
 * Create a pre-configured DLP scanner
 */
export function createDLPScanner(preset?: 'strict' | 'standard' | 'minimal'): DLPScanner {
  switch (preset) {
    case 'strict':
      return new DLPScanner({
        minConfidence: 0.3,
        includeContext: true,
        contextChars: 100,
      });

    case 'minimal':
      return new DLPScanner({
        enabledPatterns: [
          'api_key',
          'aws_key',
          'stripe_key',
          'private_key',
          'credit_card',
          'ssn',
        ],
        minConfidence: 0.8,
      });

    case 'standard':
    default:
      return new DLPScanner({
        minConfidence: 0.5,
        includeContext: true,
        contextChars: 50,
      });
  }
}

// ================================================================
// EXPORTS
// ================================================================

export { maskSensitiveData, luhnCheck, validateIBAN };
