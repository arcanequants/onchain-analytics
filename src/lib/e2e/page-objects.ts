/**
 * E2E Page Object Utilities
 *
 * Base classes and utilities for Page Object Pattern
 *
 * Phase 3, Week 10, Day 1
 */

import type {
  PageConfig,
  Selector,
  SelectorType,
  ClickOptions,
  TypeOptions,
  WaitOptions,
  NavigationOptions,
  ScreenshotOptions,
} from './types';

// ================================================================
// SELECTOR HELPERS
// ================================================================

/**
 * Create a CSS selector
 */
export function css(value: string, description?: string): Selector {
  return { type: 'css', value, description };
}

/**
 * Create a test ID selector
 */
export function testId(value: string, description?: string): Selector {
  return { type: 'testId', value, description };
}

/**
 * Create a text selector
 */
export function text(value: string, description?: string): Selector {
  return { type: 'text', value, description };
}

/**
 * Create an XPath selector
 */
export function xpath(value: string, description?: string): Selector {
  return { type: 'xpath', value, description };
}

/**
 * Create a role selector
 */
export function role(value: string, description?: string): Selector {
  return { type: 'role', value, description };
}

/**
 * Create a label selector
 */
export function label(value: string, description?: string): Selector {
  return { type: 'label', value, description };
}

/**
 * Convert selector to string based on type and config
 */
export function selectorToString(
  selector: Selector,
  testIdAttribute = 'data-testid'
): string {
  switch (selector.type) {
    case 'css':
      return selector.value;
    case 'testId':
      return `[${testIdAttribute}="${selector.value}"]`;
    case 'text':
      return `text=${selector.value}`;
    case 'xpath':
      return `xpath=${selector.value}`;
    case 'role':
      return `role=${selector.value}`;
    case 'label':
      return `label=${selector.value}`;
    default:
      return selector.value;
  }
}

// ================================================================
// BASE PAGE OBJECT
// ================================================================

/**
 * Abstract base class for page objects
 */
export abstract class BasePage {
  protected config: PageConfig;
  protected path: string;

  constructor(config: PageConfig, path: string) {
    this.config = config;
    this.path = path;
  }

  /**
   * Get full URL for the page
   */
  getUrl(): string {
    return `${this.config.baseUrl}${this.path}`;
  }

  /**
   * Get selector string
   */
  protected getSelector(selector: Selector): string {
    return selectorToString(selector);
  }

  /**
   * Abstract method to navigate to page
   */
  abstract goto(options?: NavigationOptions): Promise<void>;

  /**
   * Abstract method to wait for page ready
   */
  abstract waitForReady(): Promise<void>;

  /**
   * Abstract method to check visibility
   */
  abstract isVisible(): Promise<boolean>;

  /**
   * Abstract method to take screenshot
   */
  abstract screenshot(options?: ScreenshotOptions): Promise<string>;
}

// ================================================================
// PAGE OBJECT BUILDER
// ================================================================

export interface PageElement {
  selector: Selector;
  click(options?: ClickOptions): Promise<void>;
  type(text: string, options?: TypeOptions): Promise<void>;
  getText(): Promise<string>;
  getAttribute(name: string): Promise<string | null>;
  isVisible(): Promise<boolean>;
  waitFor(options?: WaitOptions): Promise<void>;
}

export interface PageObjectDefinition {
  path: string;
  elements: Record<string, Selector>;
  actions?: Record<string, (...args: unknown[]) => Promise<void>>;
  assertions?: Record<string, (...args: unknown[]) => Promise<boolean>>;
}

/**
 * Create a page object from definition
 */
export function createPageObject<T extends PageObjectDefinition>(
  definition: T,
  config: PageConfig
) {
  const page = {
    path: definition.path,
    url: `${config.baseUrl}${definition.path}`,
    elements: {} as Record<keyof T['elements'], PageElement>,
    selectors: definition.elements,
    config,
  };

  // Create element accessors
  for (const [name, selector] of Object.entries(definition.elements)) {
    const selectorStr = selectorToString(selector);
    page.elements[name as keyof T['elements']] = {
      selector,
      click: async () => {
        if (config.debug) {
          console.log(`[E2E] Click: ${selector.description || selectorStr}`);
        }
      },
      type: async (text: string) => {
        if (config.debug) {
          console.log(`[E2E] Type "${text}" in: ${selector.description || selectorStr}`);
        }
      },
      getText: async () => '',
      getAttribute: async () => null,
      isVisible: async () => true,
      waitFor: async () => {},
    };
  }

  return page;
}

// ================================================================
// COMMON PAGE OBJECTS
// ================================================================

/**
 * Common selectors for navigation
 */
export const navigationSelectors = {
  header: css('header', 'Page header'),
  footer: css('footer', 'Page footer'),
  nav: css('nav', 'Navigation menu'),
  mainContent: css('main', 'Main content area'),
  sidebar: css('aside', 'Sidebar'),
  logo: testId('logo', 'App logo'),
  menuToggle: testId('menu-toggle', 'Mobile menu toggle'),
  userMenu: testId('user-menu', 'User menu dropdown'),
  signInButton: testId('sign-in-button', 'Sign in button'),
  signOutButton: testId('sign-out-button', 'Sign out button'),
};

/**
 * Common selectors for forms
 */
export const formSelectors = {
  form: css('form', 'Form element'),
  submitButton: css('button[type="submit"]', 'Submit button'),
  resetButton: css('button[type="reset"]', 'Reset button'),
  cancelButton: testId('cancel-button', 'Cancel button'),
  errorMessage: css('[role="alert"]', 'Error message'),
  successMessage: css('.success-message', 'Success message'),
  loadingIndicator: testId('loading', 'Loading indicator'),
};

/**
 * Common selectors for modals
 */
export const modalSelectors = {
  overlay: css('[role="dialog"]', 'Modal overlay'),
  content: testId('modal-content', 'Modal content'),
  title: testId('modal-title', 'Modal title'),
  closeButton: testId('modal-close', 'Modal close button'),
  confirmButton: testId('modal-confirm', 'Modal confirm button'),
  cancelButton: testId('modal-cancel', 'Modal cancel button'),
};

/**
 * Common selectors for tables
 */
export const tableSelectors = {
  table: css('table', 'Data table'),
  thead: css('thead', 'Table header'),
  tbody: css('tbody', 'Table body'),
  row: css('tr', 'Table row'),
  cell: css('td', 'Table cell'),
  headerCell: css('th', 'Header cell'),
  sortButton: css('[data-sort]', 'Sort button'),
  pagination: testId('pagination', 'Pagination controls'),
  prevPage: testId('prev-page', 'Previous page'),
  nextPage: testId('next-page', 'Next page'),
};

// ================================================================
// PAGE COMPONENT BUILDER
// ================================================================

export interface ComponentDefinition {
  root: Selector;
  elements: Record<string, Selector>;
}

/**
 * Create a reusable component definition
 */
export function createComponent<T extends ComponentDefinition>(
  definition: T
): T & {
  within(parentSelector: string): T;
} {
  return {
    ...definition,
    within(parentSelector: string): T {
      const scopedElements: Record<string, Selector> = {};

      for (const [name, selector] of Object.entries(definition.elements)) {
        if (selector.type === 'css') {
          scopedElements[name] = css(
            `${parentSelector} ${selector.value}`,
            selector.description
          );
        } else {
          scopedElements[name] = selector;
        }
      }

      return {
        ...definition,
        root: css(`${parentSelector} ${selectorToString(definition.root)}`),
        elements: scopedElements as T['elements'],
      } as T;
    },
  };
}

// ================================================================
// COMMON COMPONENTS
// ================================================================

/**
 * Card component
 */
export const cardComponent = createComponent({
  root: css('.card'),
  elements: {
    title: css('.card-title'),
    content: css('.card-content'),
    footer: css('.card-footer'),
    actions: css('.card-actions'),
  },
});

/**
 * Alert component
 */
export const alertComponent = createComponent({
  root: css('[role="alert"]'),
  elements: {
    title: css('.alert-title'),
    message: css('.alert-message'),
    closeButton: css('.alert-close'),
    icon: css('.alert-icon'),
  },
});

/**
 * Dropdown component
 */
export const dropdownComponent = createComponent({
  root: css('[data-dropdown]'),
  elements: {
    trigger: css('[data-dropdown-trigger]'),
    menu: css('[data-dropdown-menu]'),
    item: css('[data-dropdown-item]'),
    divider: css('[data-dropdown-divider]'),
  },
});

/**
 * Tabs component
 */
export const tabsComponent = createComponent({
  root: css('[role="tablist"]'),
  elements: {
    tab: css('[role="tab"]'),
    panel: css('[role="tabpanel"]'),
    activeTab: css('[role="tab"][aria-selected="true"]'),
  },
});

// ================================================================
// EXPORTS
// ================================================================

export default {
  // Selector helpers
  css,
  testId,
  text,
  xpath,
  role,
  label,
  selectorToString,

  // Page object utilities
  BasePage,
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
};
