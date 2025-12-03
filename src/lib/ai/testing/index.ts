/**
 * Prompt Testing Framework
 *
 * Phase 2, Week 3, Day 5
 * Comprehensive testing framework for AI prompts
 */

import { z } from 'zod';

// ================================================================
// TYPES
// ================================================================

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
export type AssertionType =
  | 'contains'
  | 'not_contains'
  | 'matches_regex'
  | 'json_valid'
  | 'json_schema'
  | 'sentiment'
  | 'length'
  | 'mentions_brand'
  | 'custom';

export interface PromptTestCase {
  id: string;
  name: string;
  description?: string;
  tags?: string[];

  // Input
  promptTemplate: string;
  variables: Record<string, unknown>;
  provider?: string;
  model?: string;

  // Expected behavior
  assertions: PromptAssertion[];
  expectedTokenRange?: { min: number; max: number };
  expectedLatencyMs?: number;

  // Configuration
  timeout?: number;
  retries?: number;
  skip?: boolean;
}

export interface PromptAssertion {
  type: AssertionType;
  target?: 'response' | 'parsed' | 'tokens';
  value?: unknown;
  path?: string; // For JSON assertions
  message?: string;
  custom?: (response: string, parsed?: unknown) => boolean;
}

export interface PromptTestResult {
  testId: string;
  testName: string;
  status: TestStatus;
  duration: number;

  // Response info
  response?: string;
  parsedResponse?: unknown;
  tokensUsed?: number;
  cost?: number;

  // Assertions
  assertionResults: AssertionResult[];

  // Errors
  error?: string;
  errorStack?: string;

  // Metadata
  provider?: string;
  model?: string;
  timestamp: Date;
}

export interface AssertionResult {
  type: AssertionType;
  passed: boolean;
  expected?: unknown;
  actual?: unknown;
  message?: string;
}

export interface TestSuiteResult {
  suiteName: string;
  startedAt: Date;
  completedAt: Date;
  duration: number;

  // Results
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  testResults: PromptTestResult[];

  // Aggregates
  averageTokens: number;
  averageLatency: number;
  totalCost: number;
}

export interface TestRunnerOptions {
  concurrency?: number;
  verbose?: boolean;
  stopOnFirstFailure?: boolean;
  retryFailedTests?: number;
  timeout?: number;
}

// ================================================================
// PROMPT EXECUTOR INTERFACE
// ================================================================

export interface PromptExecutor {
  execute(
    prompt: string,
    options?: {
      provider?: string;
      model?: string;
      timeout?: number;
    }
  ): Promise<{
    response: string;
    tokens: number;
    cost: number;
    latencyMs: number;
  }>;
}

// ================================================================
// ASSERTION EVALUATORS
// ================================================================

const assertionEvaluators: Record<
  AssertionType,
  (response: string, assertion: PromptAssertion, parsed?: unknown) => AssertionResult
> = {
  contains: (response, assertion) => {
    const value = String(assertion.value);
    const passed = response.toLowerCase().includes(value.toLowerCase());
    return {
      type: 'contains',
      passed,
      expected: value,
      actual: passed ? value : `"${value}" not found`,
      message: assertion.message || `Response should contain "${value}"`,
    };
  },

  not_contains: (response, assertion) => {
    const value = String(assertion.value);
    const passed = !response.toLowerCase().includes(value.toLowerCase());
    return {
      type: 'not_contains',
      passed,
      expected: `Not "${value}"`,
      actual: passed ? 'Not found' : `"${value}" was found`,
      message: assertion.message || `Response should not contain "${value}"`,
    };
  },

  matches_regex: (response, assertion) => {
    const pattern = new RegExp(String(assertion.value), 'i');
    const passed = pattern.test(response);
    return {
      type: 'matches_regex',
      passed,
      expected: String(assertion.value),
      actual: passed ? 'Match found' : 'No match',
      message: assertion.message || `Response should match pattern ${assertion.value}`,
    };
  },

  json_valid: (response) => {
    let passed = false;
    let actual: unknown = 'Invalid JSON';
    try {
      JSON.parse(response);
      passed = true;
      actual = 'Valid JSON';
    } catch (e) {
      actual = e instanceof Error ? e.message : 'Invalid JSON';
    }
    return {
      type: 'json_valid',
      passed,
      expected: 'Valid JSON',
      actual,
      message: 'Response should be valid JSON',
    };
  },

  json_schema: (response, assertion) => {
    try {
      const parsed = JSON.parse(response);
      const schema = assertion.value as z.ZodType;
      const result = schema.safeParse(parsed);
      return {
        type: 'json_schema',
        passed: result.success,
        expected: 'Schema match',
        actual: result.success ? 'Schema match' : result.error.message,
        message: assertion.message || 'Response should match JSON schema',
      };
    } catch (e) {
      return {
        type: 'json_schema',
        passed: false,
        expected: 'Valid JSON matching schema',
        actual: e instanceof Error ? e.message : 'Parse error',
        message: assertion.message || 'Response should match JSON schema',
      };
    }
  },

  sentiment: (response, assertion) => {
    // Simple sentiment check based on keywords
    const positive = ['great', 'excellent', 'good', 'best', 'recommend', 'love', 'amazing'];
    const negative = ['bad', 'terrible', 'worst', 'avoid', 'hate', 'poor', 'awful'];
    const expected = assertion.value as 'positive' | 'negative' | 'neutral';

    const lowerResponse = response.toLowerCase();
    const positiveCount = positive.filter((w) => lowerResponse.includes(w)).length;
    const negativeCount = negative.filter((w) => lowerResponse.includes(w)).length;

    let actual: string;
    if (positiveCount > negativeCount) actual = 'positive';
    else if (negativeCount > positiveCount) actual = 'negative';
    else actual = 'neutral';

    return {
      type: 'sentiment',
      passed: actual === expected,
      expected,
      actual,
      message: assertion.message || `Response sentiment should be ${expected}`,
    };
  },

  length: (response, assertion) => {
    const { min, max } = assertion.value as { min?: number; max?: number };
    const length = response.length;
    let passed = true;
    let message = '';

    if (min !== undefined && length < min) {
      passed = false;
      message = `Response too short (${length} < ${min})`;
    }
    if (max !== undefined && length > max) {
      passed = false;
      message = `Response too long (${length} > ${max})`;
    }

    return {
      type: 'length',
      passed,
      expected: `${min ?? 0} - ${max ?? '∞'} chars`,
      actual: `${length} chars`,
      message: assertion.message || message || 'Response length within range',
    };
  },

  mentions_brand: (response, assertion) => {
    const brand = String(assertion.value);
    const pattern = new RegExp(`\\b${brand}\\b`, 'i');
    const passed = pattern.test(response);
    return {
      type: 'mentions_brand',
      passed,
      expected: brand,
      actual: passed ? 'Mentioned' : 'Not mentioned',
      message: assertion.message || `Response should mention "${brand}"`,
    };
  },

  custom: (response, assertion, parsed) => {
    if (!assertion.custom) {
      return {
        type: 'custom',
        passed: false,
        message: 'Custom assertion function not provided',
      };
    }
    try {
      const passed = assertion.custom(response, parsed);
      return {
        type: 'custom',
        passed,
        message: assertion.message || 'Custom assertion',
      };
    } catch (e) {
      return {
        type: 'custom',
        passed: false,
        message: e instanceof Error ? e.message : 'Custom assertion failed',
      };
    }
  },
};

// ================================================================
// PROMPT TEST RUNNER
// ================================================================

export class PromptTestRunner {
  private executor: PromptExecutor;
  private options: Required<TestRunnerOptions>;

  constructor(executor: PromptExecutor, options: TestRunnerOptions = {}) {
    this.executor = executor;
    this.options = {
      concurrency: options.concurrency ?? 1,
      verbose: options.verbose ?? false,
      stopOnFirstFailure: options.stopOnFirstFailure ?? false,
      retryFailedTests: options.retryFailedTests ?? 0,
      timeout: options.timeout ?? 30000,
    };
  }

  // ================================================================
  // RUN TESTS
  // ================================================================

  async runTest(testCase: PromptTestCase): Promise<PromptTestResult> {
    const startTime = Date.now();

    if (testCase.skip) {
      return {
        testId: testCase.id,
        testName: testCase.name,
        status: 'skipped',
        duration: 0,
        assertionResults: [],
        timestamp: new Date(),
      };
    }

    try {
      // Build prompt from template
      const prompt = this.buildPrompt(testCase.promptTemplate, testCase.variables);

      // Execute prompt
      const { response, tokens, cost, latencyMs } = await this.executor.execute(prompt, {
        provider: testCase.provider,
        model: testCase.model,
        timeout: testCase.timeout || this.options.timeout,
      });

      // Parse response if JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(response);
      } catch {
        // Not JSON, that's fine
      }

      // Run assertions
      const assertionResults = testCase.assertions.map((assertion) =>
        assertionEvaluators[assertion.type](response, assertion, parsed)
      );

      // Check token range if specified
      if (testCase.expectedTokenRange) {
        const { min, max } = testCase.expectedTokenRange;
        if (tokens < min || tokens > max) {
          assertionResults.push({
            type: 'custom',
            passed: false,
            expected: `${min}-${max} tokens`,
            actual: `${tokens} tokens`,
            message: `Token count ${tokens} outside expected range ${min}-${max}`,
          });
        }
      }

      // Check latency if specified
      if (testCase.expectedLatencyMs && latencyMs > testCase.expectedLatencyMs) {
        assertionResults.push({
          type: 'custom',
          passed: false,
          expected: `<${testCase.expectedLatencyMs}ms`,
          actual: `${latencyMs}ms`,
          message: `Latency ${latencyMs}ms exceeds expected ${testCase.expectedLatencyMs}ms`,
        });
      }

      const allPassed = assertionResults.every((r) => r.passed);
      const duration = Date.now() - startTime;

      return {
        testId: testCase.id,
        testName: testCase.name,
        status: allPassed ? 'passed' : 'failed',
        duration,
        response,
        parsedResponse: parsed,
        tokensUsed: tokens,
        cost,
        assertionResults,
        provider: testCase.provider,
        model: testCase.model,
        timestamp: new Date(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testId: testCase.id,
        testName: testCase.name,
        status: 'failed',
        duration,
        assertionResults: [],
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date(),
      };
    }
  }

  async runSuite(
    suiteName: string,
    testCases: PromptTestCase[]
  ): Promise<TestSuiteResult> {
    const startedAt = new Date();
    const testResults: PromptTestResult[] = [];

    if (this.options.verbose) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Running: ${suiteName}`);
      console.log(`Tests: ${testCases.length}`);
      console.log(`${'='.repeat(60)}\n`);
    }

    // Run tests with concurrency control
    const chunks = this.chunkArray(testCases, this.options.concurrency);

    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async (testCase) => {
          let result = await this.runTest(testCase);

          // Retry if failed
          if (result.status === 'failed' && this.options.retryFailedTests > 0) {
            for (let retry = 0; retry < this.options.retryFailedTests; retry++) {
              if (this.options.verbose) {
                console.log(`  Retrying ${testCase.name} (attempt ${retry + 2})`);
              }
              result = await this.runTest(testCase);
              if (result.status === 'passed') break;
            }
          }

          if (this.options.verbose) {
            const icon = result.status === 'passed' ? 'PASS' : result.status === 'skipped' ? 'SKIP' : 'FAIL';
            console.log(`  [${icon}] ${testCase.name} (${result.duration}ms)`);
            if (result.status === 'failed') {
              result.assertionResults
                .filter((a) => !a.passed)
                .forEach((a) => console.log(`    - ${a.message}`));
              if (result.error) console.log(`    Error: ${result.error}`);
            }
          }

          return result;
        })
      );

      testResults.push(...results);

      // Stop on first failure if configured
      if (
        this.options.stopOnFirstFailure &&
        results.some((r) => r.status === 'failed')
      ) {
        break;
      }
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    // Aggregate results
    const passed = testResults.filter((r) => r.status === 'passed').length;
    const failed = testResults.filter((r) => r.status === 'failed').length;
    const skipped = testResults.filter((r) => r.status === 'skipped').length;

    const tokensUsed = testResults
      .filter((r) => r.tokensUsed !== undefined)
      .map((r) => r.tokensUsed!);
    const averageTokens =
      tokensUsed.length > 0
        ? tokensUsed.reduce((a, b) => a + b, 0) / tokensUsed.length
        : 0;

    const latencies = testResults.map((r) => r.duration);
    const averageLatency =
      latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0;

    const totalCost = testResults
      .filter((r) => r.cost !== undefined)
      .reduce((sum, r) => sum + r.cost!, 0);

    if (this.options.verbose) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
      console.log(`Duration: ${duration}ms`);
      console.log(`Avg Tokens: ${averageTokens.toFixed(0)}`);
      console.log(`Total Cost: $${totalCost.toFixed(4)}`);
      console.log(`${'='.repeat(60)}\n`);
    }

    return {
      suiteName,
      startedAt,
      completedAt,
      duration,
      totalTests: testCases.length,
      passed,
      failed,
      skipped,
      testResults,
      averageTokens,
      averageLatency,
      totalCost,
    };
  }

  // ================================================================
  // HELPERS
  // ================================================================

  private buildPrompt(
    template: string,
    variables: Record<string, unknown>
  ): string {
    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      prompt = prompt.replace(placeholder, String(value));
    }
    return prompt;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// ================================================================
// TEST BUILDERS
// ================================================================

export class PromptTestBuilder {
  private testCase: Partial<PromptTestCase> = {
    assertions: [],
    variables: {},
  };

  id(id: string): this {
    this.testCase.id = id;
    return this;
  }

  name(name: string): this {
    this.testCase.name = name;
    return this;
  }

  description(description: string): this {
    this.testCase.description = description;
    return this;
  }

  tags(...tags: string[]): this {
    this.testCase.tags = tags;
    return this;
  }

  prompt(template: string): this {
    this.testCase.promptTemplate = template;
    return this;
  }

  variable(key: string, value: unknown): this {
    this.testCase.variables![key] = value;
    return this;
  }

  variables(vars: Record<string, unknown>): this {
    this.testCase.variables = { ...this.testCase.variables, ...vars };
    return this;
  }

  provider(provider: string): this {
    this.testCase.provider = provider;
    return this;
  }

  model(model: string): this {
    this.testCase.model = model;
    return this;
  }

  shouldContain(value: string, message?: string): this {
    this.testCase.assertions!.push({ type: 'contains', value, message });
    return this;
  }

  shouldNotContain(value: string, message?: string): this {
    this.testCase.assertions!.push({ type: 'not_contains', value, message });
    return this;
  }

  shouldMatch(pattern: string, message?: string): this {
    this.testCase.assertions!.push({ type: 'matches_regex', value: pattern, message });
    return this;
  }

  shouldBeValidJson(): this {
    this.testCase.assertions!.push({ type: 'json_valid' });
    return this;
  }

  shouldMatchSchema(schema: z.ZodType, message?: string): this {
    this.testCase.assertions!.push({ type: 'json_schema', value: schema, message });
    return this;
  }

  shouldHaveSentiment(sentiment: 'positive' | 'negative' | 'neutral'): this {
    this.testCase.assertions!.push({ type: 'sentiment', value: sentiment });
    return this;
  }

  shouldHaveLength(min?: number, max?: number): this {
    this.testCase.assertions!.push({ type: 'length', value: { min, max } });
    return this;
  }

  shouldMentionBrand(brand: string): this {
    this.testCase.assertions!.push({ type: 'mentions_brand', value: brand });
    return this;
  }

  shouldPass(fn: (response: string, parsed?: unknown) => boolean, message?: string): this {
    this.testCase.assertions!.push({ type: 'custom', custom: fn, message });
    return this;
  }

  expectTokens(min: number, max: number): this {
    this.testCase.expectedTokenRange = { min, max };
    return this;
  }

  expectLatency(maxMs: number): this {
    this.testCase.expectedLatencyMs = maxMs;
    return this;
  }

  timeout(ms: number): this {
    this.testCase.timeout = ms;
    return this;
  }

  retries(count: number): this {
    this.testCase.retries = count;
    return this;
  }

  skip(): this {
    this.testCase.skip = true;
    return this;
  }

  build(): PromptTestCase {
    if (!this.testCase.id) {
      this.testCase.id = `test_${Date.now()}`;
    }
    if (!this.testCase.name) {
      this.testCase.name = this.testCase.id;
    }
    if (!this.testCase.promptTemplate) {
      throw new Error('Prompt template is required');
    }

    return this.testCase as PromptTestCase;
  }
}

// ================================================================
// CONVENIENCE
// ================================================================

export function test(name: string): PromptTestBuilder {
  return new PromptTestBuilder().name(name);
}

export function describe(suiteName: string, testCases: PromptTestCase[]): { name: string; tests: PromptTestCase[] } {
  return { name: suiteName, tests: testCases };
}
