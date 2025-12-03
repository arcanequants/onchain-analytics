/**
 * Keyboard Shortcuts Help Dialog
 *
 * Phase 4, Week 8 Extended
 * Modal displaying all available keyboard shortcuts
 */

'use client';

import { useEffect, useRef } from 'react';
import {
  KeyboardShortcut,
  groupShortcuts,
  formatShortcut,
  MODIFIER_SYMBOLS,
} from '@/hooks/useKeyboardShortcuts';

// ============================================================================
// Types
// ============================================================================

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function KeyboardShortcutsHelp({
  shortcuts,
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const groups = groupShortcuts(shortcuts);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl">
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="shortcuts-title"
          className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 id="shortcuts-title" className="text-lg font-semibold text-white">
                  Keyboard Shortcuts
                </h2>
                <p className="text-sm text-gray-400">
                  Press <kbd className="px-1.5 py-0.5 mx-1 text-xs bg-gray-800 rounded border border-gray-700">
                    {MODIFIER_SYMBOLS.meta}?
                  </kbd> anytime to show this dialog
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((group) => (
                <div key={group.category}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {group.category}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut, index) => (
                      <div
                        key={`${shortcut.key}-${index}`}
                        className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg"
                      >
                        <span className="text-sm text-gray-300">
                          {shortcut.description}
                        </span>
                        <ShortcutKeys
                          keyName={shortcut.key}
                          modifiers={shortcut.modifiers}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-700 bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Tip: Most shortcuts work with both {MODIFIER_SYMBOLS.meta} (Mac) and Ctrl (Windows/Linux)
              </span>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Shortcut Keys Display Component
// ============================================================================

interface ShortcutKeysProps {
  keyName: string;
  modifiers?: Array<'meta' | 'ctrl' | 'alt' | 'shift'>;
}

function ShortcutKeys({ keyName, modifiers = [] }: ShortcutKeysProps) {
  const keys: string[] = [];

  // Add modifier symbols
  modifiers.forEach((mod) => {
    keys.push(MODIFIER_SYMBOLS[mod]);
  });

  // Add the key itself
  const displayKey = keyName.length === 1 ? keyName.toUpperCase() : formatKeyName(keyName);
  keys.push(displayKey);

  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <kbd
          key={index}
          className="min-w-[24px] px-2 py-1 text-xs text-center text-gray-300 bg-gray-900 rounded border border-gray-700 font-mono"
        >
          {key}
        </kbd>
      ))}
    </div>
  );
}

function formatKeyName(key: string): string {
  const keyMap: Record<string, string> = {
    escape: 'Esc',
    enter: '↵',
    space: 'Space',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    backspace: '⌫',
    delete: 'Del',
    tab: 'Tab',
  };
  return keyMap[key.toLowerCase()] || key;
}

// ============================================================================
// Inline Shortcut Badge Component
// ============================================================================

interface ShortcutBadgeProps {
  keyName: string;
  modifiers?: Array<'meta' | 'ctrl' | 'alt' | 'shift'>;
  className?: string;
}

export function ShortcutBadge({ keyName, modifiers = [], className = '' }: ShortcutBadgeProps) {
  const shortcut = formatShortcut(keyName, modifiers);

  return (
    <kbd className={`px-2 py-0.5 text-xs text-gray-500 bg-gray-800 rounded border border-gray-700 ${className}`}>
      {shortcut}
    </kbd>
  );
}

export default KeyboardShortcutsHelp;
