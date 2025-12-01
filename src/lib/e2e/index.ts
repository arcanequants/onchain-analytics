/**
 * E2E Testing Utilities Module
 *
 * Comprehensive utilities for end-to-end testing
 *
 * Phase 3, Week 10, Day 1
 */

// ================================================================
// TYPES
// ================================================================

export type {
  // Page objects
  PageObject,
  PageConfig,

  // Test context
  E2ETestContext,
  TestStep,

  // Selectors
  SelectorType,
  Selector,
  SelectorConfig,

  // Actions
  ClickOptions,
  TypeOptions,
  WaitOptions,
  NavigationOptions,

  // Assertions
  AssertionOptions,
  TextAssertionOptions,
  VisibilityAssertionOptions,

  // Mock API
  MockRoute,
  MockRequest,
  MockResponse,

  // Auth
  AuthState,
  LoginCredentials,
  AuthStorageState,
  Cookie,

  // Network
  NetworkRequest,
  NetworkResponse,
  NetworkLog,

  // Visual
  ScreenshotOptions,
  VisualComparisonResult,
  VisualComparisonOptions,

  // Accessibility
  AccessibilityResult,
  AccessibilityViolation,
  AccessibilityNode,
  AccessibilityOptions,

  // Performance
  PerformanceMetrics,
  PerformanceOptions,

  // Reports
  TestReport,
  TestResult,
} from './types';

// ================================================================
// PAGE OBJECTS
// ================================================================

export {
  // Selector helpers
  css,
  testId,
  text,
  xpath,
  role,
  label,
  selectorToString,

  // Base classes
  BasePage,

  // Factories
  createPageObject,
  createComponent,

  // Common selectors
  navigationSelectors,
  formSelectors,
  modalSelectors,
  tableSelectors,

  // Common components
  cardComponent,
  alertComponent,
  dropdownComponent,
  tabsComponent,

  // Types
  type PageElement,
  type PageObjectDefinition,
  type ComponentDefinition,
} from './page-objects';

// ================================================================
// TEST HELPERS
// ================================================================

export {
  // Test context
  createTestContext,
  addStep,
  completeStep,
  getTestDuration,

  // Mock API
  mockRoute,
  clearMockRoutes,
  findMockRoute,
  createMockResponse,
  mockResponses,

  // Auth
  createAuthState,
  createAuthStorageState,
  mockLogin,
  mockLogout,

  // Network
  createNetworkLog,
  logRequest,
  logResponse,
  logFailure,
  getRequestsByUrl,
  getRequestsByMethod,
  waitForRequest,

  // Performance
  createMockPerformanceMetrics,
  checkCoreWebVitals,

  // Accessibility
  createMockAccessibilityResult,
  hasCriticalViolations,
  getViolationsByImpact,

  // Reports
  createTestReport,
  createTestResult,
  formatReportSummary,

  // Data
  testData,

  // Waits
  waitFor,
  wait,
  retry,
} from './test-helpers';
