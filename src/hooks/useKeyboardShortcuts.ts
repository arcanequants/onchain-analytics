/**
 * Keyboard Shortcuts Hook
 *
 * Phase 4, Week 8 Extended
 * Centralized keyboard shortcut management for admin interface
 *
 * Shortcuts:
 * - cmd+K: Open command palette
 * - cmd+B: Toggle sidebar
 * - cmd+1-9: Quick navigation to admin sections
 * - cmd+Shift+F: Focus search
 * - cmd+Shift+N: New notification
 * - cmd+/: Show keyboard shortcuts help
 * - Escape: Close modals/dialogs
 */

import { useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ModifierKey = 'meta' | 'ctrl' | 'alt' | 'shift';

export interface KeyboardShortcut {
  key: string;
  modifiers?: ModifierKey[];
  action: () => void;
  description?: string;
  category?: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
  onShortcutTriggered?: (shortcut: KeyboardShortcut) => void;
}

export interface ShortcutGroup {
  category: string;
  shortcuts: Array<{
    key: string;
    modifiers: ModifierKey[];
    description: string;
  }>;
}

// ============================================================================
// Constants
// ============================================================================

const MODIFIER_MAP: Record<ModifierKey, keyof KeyboardEvent> = {
  meta: 'metaKey',
  ctrl: 'ctrlKey',
  alt: 'altKey',
  shift: 'shiftKey',
};

// Platform detection for displaying correct modifier key
const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export const MODIFIER_SYMBOLS: Record<ModifierKey, string> = {
  meta: isMac ? '⌘' : 'Ctrl',
  ctrl: isMac ? '⌃' : 'Ctrl',
  alt: isMac ? '⌥' : 'Alt',
  shift: '⇧',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize key to handle special cases
 */
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    'esc': 'escape',
    'del': 'delete',
    'return': 'enter',
    ' ': 'space',
  };
  return keyMap[key.toLowerCase()] || key.toLowerCase();
}

/**
 * Check if event matches shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const pressedKey = normalizeKey(event.key);
  const targetKey = normalizeKey(shortcut.key);

  if (pressedKey !== targetKey) return false;

  const modifiers = shortcut.modifiers || [];

  // Check required modifiers are pressed
  for (const mod of modifiers) {
    const eventKey = MODIFIER_MAP[mod];
    if (!event[eventKey]) return false;
  }

  // Check no extra modifiers are pressed (except for number keys where we allow flexibility)
  const isNumberKey = /^[0-9]$/.test(targetKey);
  if (!isNumberKey) {
    const allModifiers: ModifierKey[] = ['meta', 'ctrl', 'alt', 'shift'];
    for (const mod of allModifiers) {
      if (!modifiers.includes(mod) && event[MODIFIER_MAP[mod]]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if event target is an input element
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isEditable = target.isContentEditable;

  return isInput || isEditable;
}

/**
 * Format shortcut for display
 */
export function formatShortcut(key: string, modifiers?: ModifierKey[]): string {
  const modSymbols = (modifiers || []).map(m => MODIFIER_SYMBOLS[m]);
  const keyDisplay = key.length === 1 ? key.toUpperCase() : key;
  return [...modSymbols, keyDisplay].join(isMac ? '' : '+');
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Main keyboard shortcuts hook
 */
export function useKeyboardShortcuts({
  enabled = true,
  shortcuts,
  onShortcutTriggered,
}: UseKeyboardShortcutsOptions): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if shortcuts are disabled
    if (!enabled) return;

    // Skip if typing in input (unless shortcut explicitly allows it)
    const isInput = isInputElement(event.target);

    for (const shortcut of shortcutsRef.current) {
      // Skip disabled shortcuts
      if (shortcut.enabled === false) continue;

      // Skip shortcuts in inputs unless they use modifiers
      if (isInput && (!shortcut.modifiers || shortcut.modifiers.length === 0)) {
        continue;
      }

      if (matchesShortcut(event, shortcut)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }

        shortcut.action();
        onShortcutTriggered?.(shortcut);
        return;
      }
    }
  }, [enabled, onShortcutTriggered]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// ============================================================================
// Pre-defined Shortcut Configurations
// ============================================================================

export interface AdminShortcutsConfig {
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  onNavigate?: (path: string) => void;
  onShowHelp?: () => void;
  onFocusSearch?: () => void;
  onRefresh?: () => void;
  onEscape?: () => void;
}

/**
 * Get admin-specific shortcuts
 */
export function getAdminShortcuts(config: AdminShortcutsConfig): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  // Navigation shortcuts (cmd+1-9)
  const navPaths = [
    '/admin/ceo',
    '/admin/finance',
    '/admin/ops',
    '/admin/health',
    '/admin/costs',
    '/admin/queues',
    '/admin/vendors',
    '/admin/notifications',
    '/admin/audit',
  ];

  navPaths.forEach((path, index) => {
    shortcuts.push({
      key: String(index + 1),
      modifiers: ['meta'],
      action: () => config.onNavigate?.(path),
      description: `Go to ${path.split('/').pop()}`,
      category: 'Navigation',
    });
  });

  // Toggle sidebar (cmd+B)
  if (config.onToggleSidebar) {
    shortcuts.push({
      key: 'b',
      modifiers: ['meta'],
      action: config.onToggleSidebar,
      description: 'Toggle sidebar',
      category: 'UI',
    });
  }

  // Command palette (cmd+K)
  if (config.onOpenCommandPalette) {
    shortcuts.push({
      key: 'k',
      modifiers: ['meta'],
      action: config.onOpenCommandPalette,
      description: 'Open command palette',
      category: 'UI',
    });
  }

  // Focus search (cmd+shift+F)
  if (config.onFocusSearch) {
    shortcuts.push({
      key: 'f',
      modifiers: ['meta', 'shift'],
      action: config.onFocusSearch,
      description: 'Focus search',
      category: 'UI',
    });
  }

  // Refresh (cmd+R, but let browser handle it by not preventing default)
  if (config.onRefresh) {
    shortcuts.push({
      key: 'r',
      modifiers: ['meta', 'shift'],
      action: config.onRefresh,
      description: 'Refresh data',
      category: 'Actions',
    });
  }

  // Show help (cmd+/)
  if (config.onShowHelp) {
    shortcuts.push({
      key: '/',
      modifiers: ['meta'],
      action: config.onShowHelp,
      description: 'Show keyboard shortcuts',
      category: 'Help',
    });
  }

  // Escape (close modals)
  if (config.onEscape) {
    shortcuts.push({
      key: 'Escape',
      action: config.onEscape,
      description: 'Close dialog',
      category: 'UI',
      preventDefault: false,
    });
  }

  return shortcuts;
}

/**
 * Group shortcuts by category for display
 */
export function groupShortcuts(shortcuts: KeyboardShortcut[]): ShortcutGroup[] {
  const groups: Record<string, ShortcutGroup> = {};

  for (const shortcut of shortcuts) {
    const category = shortcut.category || 'Other';

    if (!groups[category]) {
      groups[category] = {
        category,
        shortcuts: [],
      };
    }

    groups[category].shortcuts.push({
      key: shortcut.key,
      modifiers: shortcut.modifiers || [],
      description: shortcut.description || 'No description',
    });
  }

  return Object.values(groups);
}

// ============================================================================
// Keyboard Shortcuts Help Dialog Component
// ============================================================================

export interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
}

// Export a simple shortcut display helper
export function getShortcutDisplay(key: string, modifiers?: ModifierKey[]): {
  symbol: string;
  text: string;
} {
  const modSymbols = (modifiers || []).map(m => MODIFIER_SYMBOLS[m]).join('');
  const keyDisplay = key.length === 1 ? key.toUpperCase() : key;

  return {
    symbol: modSymbols + keyDisplay,
    text: formatShortcut(key, modifiers),
  };
}

export default useKeyboardShortcuts;
