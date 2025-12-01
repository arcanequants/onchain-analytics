/**
 * E2E Testing Types
 *
 * Type definitions for end-to-end testing utilities
 *
 * Phase 3, Week 10, Day 1
 */

// ================================================================
// PAGE OBJECTS
// ================================================================

export interface PageObject {
  /** Navigate to the page */
  goto(): Promise<void>;
  /** Wait for page to be ready */
  waitForReady(): Promise<void>;
  /** Get the current URL */
  getUrl(): string;
  /** Check if page is visible */
  isVisible(): Promise<boolean>;
}

export interface PageConfig {
  /** Base URL for the application */
  baseUrl: string;
  /** Default timeout in milliseconds */
  defaultTimeout: number;
  /** Screenshot directory */
  screenshotDir?: string;
  /** Enable debug mode */
  debug?: boolean;
}

// ================================================================
// TEST CONTEXT
// ================================================================

export interface E2ETestContext {
  /** Test name */
  testName: string;
  /** Start time */
  startTime: Date;
  /** Current step */
  currentStep: number;
  /** Steps performed */
  steps: TestStep[];
  /** Screenshots taken */
  screenshots: string[];
  /** Errors encountered */
  errors: Error[];
}

export interface TestStep {
  /** Step number */
  number: number;
  /** Step description */
  description: string;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime?: Date;
  /** Duration in ms */
  duration?: number;
  /** Status */
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  /** Error if failed */
  error?: Error;
  /** Screenshot path */
  screenshot?: string;
}

// ================================================================
// SELECTORS
// ================================================================

export type SelectorType =
  | 'css'
  | 'xpath'
  | 'text'
  | 'testId'
  | 'role'
  | 'label';

export interface Selector {
  /** Selector type */
  type: SelectorType;
  /** Selector value */
  value: string;
  /** Description for debugging */
  description?: string;
}

export interface SelectorConfig {
  /** Test ID attribute name */
  testIdAttribute: string;
  /** Default selector type */
  defaultType: SelectorType;
}

// ================================================================
// ACTIONS
// ================================================================

export interface ClickOptions {
  /** Button to click */
  button?: 'left' | 'right' | 'middle';
  /** Click count */
  clickCount?: number;
  /** Delay between clicks */
  delay?: number;
  /** Force click even if not visible */
  force?: boolean;
  /** Modifier keys */
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
  /** Position within element */
  position?: { x: number; y: number };
  /** Timeout */
  timeout?: number;
}

export interface TypeOptions {
  /** Delay between keystrokes */
  delay?: number;
  /** Clear existing text first */
  clear?: boolean;
  /** Timeout */
  timeout?: number;
}

export interface WaitOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Polling interval */
  interval?: number;
  /** Wait state */
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}

export interface NavigationOptions {
  /** Wait until condition */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  /** Timeout */
  timeout?: number;
}

// ================================================================
// ASSERTIONS
// ================================================================

export interface AssertionOptions {
  /** Timeout for assertion */
  timeout?: number;
  /** Custom error message */
  message?: string;
  /** Soft assertion (don't fail test) */
  soft?: boolean;
}

export interface TextAssertionOptions extends AssertionOptions {
  /** Case-insensitive matching */
  ignoreCase?: boolean;
  /** Normalize whitespace */
  normalizeWhitespace?: boolean;
}

export interface VisibilityAssertionOptions extends AssertionOptions {
  /** Minimum visible ratio */
  ratio?: number;
}

// ================================================================
// MOCK API
// ================================================================

export interface MockRoute {
  /** URL pattern to match */
  url: string | RegExp;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Response status */
  status?: number;
  /** Response headers */
  headers?: Record<string, string>;
  /** Response body */
  body?: unknown;
  /** Response delay in ms */
  delay?: number;
  /** Handler function */
  handler?: (request: MockRequest) => MockResponse | Promise<MockResponse>;
}

export interface MockRequest {
  /** Request URL */
  url: string;
  /** Request method */
  method: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body */
  body?: unknown;
  /** Query parameters */
  query: Record<string, string>;
}

export interface MockResponse {
  /** Response status */
  status: number;
  /** Response headers */
  headers?: Record<string, string>;
  /** Response body */
  body?: unknown;
}

// ================================================================
// AUTHENTICATION
// ================================================================

export interface AuthState {
  /** User is authenticated */
  isAuthenticated: boolean;
  /** User ID */
  userId?: string;
  /** User email */
  email?: string;
  /** Auth token */
  token?: string;
  /** Token expiration */
  expiresAt?: Date;
  /** User roles */
  roles?: string[];
}

export interface LoginCredentials {
  /** Email */
  email: string;
  /** Password */
  password: string;
}

export interface AuthStorageState {
  /** Cookies */
  cookies: Cookie[];
  /** Local storage items */
  localStorage: Record<string, string>;
  /** Session storage items */
  sessionStorage: Record<string, string>;
}

export interface Cookie {
  /** Cookie name */
  name: string;
  /** Cookie value */
  value: string;
  /** Domain */
  domain?: string;
  /** Path */
  path?: string;
  /** Expiration */
  expires?: number;
  /** HttpOnly flag */
  httpOnly?: boolean;
  /** Secure flag */
  secure?: boolean;
  /** SameSite */
  sameSite?: 'Strict' | 'Lax' | 'None';
}

// ================================================================
// NETWORK
// ================================================================

export interface NetworkRequest {
  /** Request ID */
  id: string;
  /** Request URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body */
  body?: unknown;
  /** Timestamp */
  timestamp: Date;
  /** Resource type */
  resourceType: string;
}

export interface NetworkResponse {
  /** Request ID */
  requestId: string;
  /** Response status */
  status: number;
  /** Status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body?: unknown;
  /** Timestamp */
  timestamp: Date;
  /** Response time in ms */
  timing: number;
}

export interface NetworkLog {
  /** All requests */
  requests: NetworkRequest[];
  /** All responses */
  responses: NetworkResponse[];
  /** Failed requests */
  failures: NetworkRequest[];
}

// ================================================================
// VISUAL TESTING
// ================================================================

export interface ScreenshotOptions {
  /** Full page screenshot */
  fullPage?: boolean;
  /** Clip region */
  clip?: { x: number; y: number; width: number; height: number };
  /** Omit background */
  omitBackground?: boolean;
  /** Quality (0-100, JPEG only) */
  quality?: number;
  /** File type */
  type?: 'png' | 'jpeg';
  /** Animation state */
  animations?: 'disabled' | 'allow';
  /** Mask elements */
  mask?: Selector[];
}

export interface VisualComparisonResult {
  /** Comparison passed */
  passed: boolean;
  /** Difference percentage */
  diffPercentage: number;
  /** Diff image path */
  diffImagePath?: string;
  /** Expected image path */
  expectedPath: string;
  /** Actual image path */
  actualPath: string;
}

export interface VisualComparisonOptions {
  /** Maximum allowed difference */
  threshold?: number;
  /** Anti-aliasing detection */
  antialiasing?: boolean;
  /** Ignore colors */
  ignoreColors?: boolean;
  /** Update baseline */
  updateBaseline?: boolean;
}

// ================================================================
// ACCESSIBILITY
// ================================================================

export interface AccessibilityResult {
  /** All violations */
  violations: AccessibilityViolation[];
  /** Passed rules */
  passes: string[];
  /** Incomplete checks */
  incomplete: string[];
  /** Inapplicable rules */
  inapplicable: string[];
}

export interface AccessibilityViolation {
  /** Rule ID */
  id: string;
  /** Impact level */
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  /** Description */
  description: string;
  /** Help URL */
  helpUrl: string;
  /** Affected elements */
  nodes: AccessibilityNode[];
  /** Tags */
  tags: string[];
}

export interface AccessibilityNode {
  /** Element HTML */
  html: string;
  /** CSS selector */
  target: string[];
  /** Failure summary */
  failureSummary: string;
}

export interface AccessibilityOptions {
  /** Rules to run */
  runOnly?: string[];
  /** Rules to skip */
  skip?: string[];
  /** Include incomplete */
  includeIncomplete?: boolean;
  /** Include inapplicable */
  includeInapplicable?: boolean;
}

// ================================================================
// PERFORMANCE
// ================================================================

export interface PerformanceMetrics {
  /** Time to first byte */
  ttfb: number;
  /** First contentful paint */
  fcp: number;
  /** Largest contentful paint */
  lcp: number;
  /** First input delay */
  fid?: number;
  /** Cumulative layout shift */
  cls: number;
  /** Time to interactive */
  tti: number;
  /** Total blocking time */
  tbt: number;
  /** Speed index */
  speedIndex: number;
}

export interface PerformanceOptions {
  /** Throttle CPU */
  cpuThrottling?: number;
  /** Throttle network */
  networkThrottling?: 'slow3G' | 'fast3G' | '4G';
  /** Clear cache */
  clearCache?: boolean;
}

// ================================================================
// REPORTS
// ================================================================

export interface TestReport {
  /** Report ID */
  id: string;
  /** Report timestamp */
  timestamp: Date;
  /** Environment */
  environment: string;
  /** Total tests */
  totalTests: number;
  /** Passed tests */
  passed: number;
  /** Failed tests */
  failed: number;
  /** Skipped tests */
  skipped: number;
  /** Duration in ms */
  duration: number;
  /** Test results */
  results: TestResult[];
}

export interface TestResult {
  /** Test name */
  name: string;
  /** Test file */
  file: string;
  /** Status */
  status: 'passed' | 'failed' | 'skipped';
  /** Duration in ms */
  duration: number;
  /** Error if failed */
  error?: string;
  /** Stack trace */
  stackTrace?: string;
  /** Screenshots */
  screenshots: string[];
  /** Retries */
  retries: number;
}
