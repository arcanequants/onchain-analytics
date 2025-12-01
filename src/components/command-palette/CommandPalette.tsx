/**
 * Command Palette Component
 * Phase 4, Week 8 - Internal Tools & DX Checklist
 *
 * A keyboard-driven command palette (Cmd+K / Ctrl+K) for quick navigation
 * and actions throughout the application.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Types
export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  category: CommandCategory;
  action: () => void | Promise<void>;
  keywords?: string[];
}

export type CommandCategory =
  | 'navigation'
  | 'actions'
  | 'settings'
  | 'analytics'
  | 'wallets'
  | 'tokens'
  | 'recent';

interface CommandPaletteProps {
  commands?: Command[];
  placeholder?: string;
  maxResults?: number;
}

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  registerCommand: (command: Command) => void;
  unregisterCommand: (id: string) => void;
}

// Context for global access
const CommandPaletteContext = React.createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}

// Icons
const icons = {
  search: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  home: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  chart: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  wallet: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  token: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  settings: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  action: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  recent: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const categoryIcons: Record<CommandCategory, React.ReactNode> = {
  navigation: icons.home,
  actions: icons.action,
  settings: icons.settings,
  analytics: icons.chart,
  wallets: icons.wallet,
  tokens: icons.token,
  recent: icons.recent,
};

const categoryLabels: Record<CommandCategory, string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  settings: 'Settings',
  analytics: 'Analytics',
  wallets: 'Wallets',
  tokens: 'Tokens',
  recent: 'Recent',
};

// Command Palette Component
export function CommandPalette({
  commands: externalCommands = [],
  placeholder = 'Type a command or search...',
  maxResults = 10,
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [registeredCommands, setRegisteredCommands] = useState<Command[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Default commands
  const defaultCommands: Command[] = useMemo(() => [
    {
      id: 'nav-home',
      label: 'Go to Dashboard',
      description: 'Navigate to the main dashboard',
      icon: icons.home,
      shortcut: ['G', 'D'],
      category: 'navigation',
      action: () => router.push('/'),
      keywords: ['home', 'main', 'start'],
    },
    {
      id: 'nav-analytics',
      label: 'Go to Analytics',
      description: 'View analytics and metrics',
      icon: icons.chart,
      shortcut: ['G', 'A'],
      category: 'navigation',
      action: () => router.push('/analytics'),
      keywords: ['metrics', 'data', 'charts'],
    },
    {
      id: 'nav-wallets',
      label: 'Go to Wallets',
      description: 'Manage tracked wallets',
      icon: icons.wallet,
      shortcut: ['G', 'W'],
      category: 'navigation',
      action: () => router.push('/wallets'),
      keywords: ['addresses', 'track'],
    },
    {
      id: 'nav-tokens',
      label: 'Go to Token Prices',
      description: 'View token price data',
      icon: icons.token,
      shortcut: ['G', 'T'],
      category: 'navigation',
      action: () => router.push('/tokens'),
      keywords: ['crypto', 'prices', 'market'],
    },
    {
      id: 'nav-tvl',
      label: 'Go to TVL Analytics',
      description: 'Total Value Locked analysis',
      icon: icons.chart,
      category: 'analytics',
      action: () => router.push('/tvl'),
      keywords: ['defi', 'locked', 'protocols'],
    },
    {
      id: 'nav-gas',
      label: 'Go to Gas Tracker',
      description: 'Monitor gas prices',
      icon: icons.chart,
      category: 'analytics',
      action: () => router.push('/gas'),
      keywords: ['fees', 'ethereum', 'transaction'],
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Configure application settings',
      icon: icons.settings,
      shortcut: ['G', 'S'],
      category: 'settings',
      action: () => router.push('/settings'),
      keywords: ['preferences', 'config'],
    },
    {
      id: 'action-refresh',
      label: 'Refresh Data',
      description: 'Refresh all data on current page',
      icon: icons.action,
      shortcut: ['R'],
      category: 'actions',
      action: () => window.location.reload(),
      keywords: ['reload', 'update'],
    },
    {
      id: 'action-theme',
      label: 'Toggle Dark Mode',
      description: 'Switch between light and dark themes',
      icon: icons.settings,
      shortcut: ['T'],
      category: 'settings',
      action: () => document.documentElement.classList.toggle('dark'),
      keywords: ['theme', 'light', 'appearance'],
    },
  ], [router]);

  // Combine all commands
  const allCommands = useMemo(() => [
    ...defaultCommands,
    ...externalCommands,
    ...registeredCommands,
  ], [defaultCommands, externalCommands, registeredCommands]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return allCommands.slice(0, maxResults);

    const lowerQuery = query.toLowerCase();
    return allCommands
      .filter((cmd) => {
        const searchText = [
          cmd.label,
          cmd.description,
          ...(cmd.keywords || []),
        ]
          .join(' ')
          .toLowerCase();
        return searchText.includes(lowerQuery);
      })
      .slice(0, maxResults);
  }, [allCommands, query, maxResults]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<CommandCategory, Command[]> = {
      recent: [],
      navigation: [],
      actions: [],
      analytics: [],
      wallets: [],
      tokens: [],
      settings: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    return Object.entries(groups).filter(([, cmds]) => cmds.length > 0);
  }, [filteredCommands]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Navigation within palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const executeCommand = useCallback(async (command: Command) => {
    setIsOpen(false);
    await command.action();
  }, []);

  const registerCommand = useCallback((command: Command) => {
    setRegisteredCommands((prev) => [...prev, command]);
  }, []);

  const unregisterCommand = useCallback((id: string) => {
    setRegisteredCommands((prev) => prev.filter((cmd) => cmd.id !== id));
  }, []);

  const contextValue: CommandPaletteContextValue = {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    registerCommand,
    unregisterCommand,
  };

  if (!isOpen) {
    return (
      <CommandPaletteContext.Provider value={contextValue}>
        {null}
      </CommandPaletteContext.Provider>
    );
  }

  let currentIndex = 0;

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-24 z-50 mx-auto max-w-xl px-4">
        <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-gray-700 px-4">
            <span className="text-gray-400">{icons.search}</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder={placeholder}
              className="flex-1 bg-transparent py-4 text-white placeholder:text-gray-500 focus:outline-none"
            />
            <kbd className="hidden rounded bg-gray-800 px-2 py-1 text-xs text-gray-400 sm:inline">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
            {groupedCommands.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No commands found for "{query}"
              </div>
            ) : (
              groupedCommands.map(([category, commands]) => (
                <div key={category} className="mb-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-gray-500">
                    {categoryIcons[category as CommandCategory]}
                    {categoryLabels[category as CommandCategory]}
                  </div>
                  {commands.map((command) => {
                    const index = currentIndex++;
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={command.id}
                        data-index={index}
                        onClick={() => executeCommand(command)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <span
                          className={
                            isSelected ? 'text-white' : 'text-gray-500'
                          }
                        >
                          {command.icon || categoryIcons[command.category]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{command.label}</div>
                          {command.description && (
                            <div
                              className={`truncate text-sm ${
                                isSelected ? 'text-blue-200' : 'text-gray-500'
                              }`}
                            >
                              {command.description}
                            </div>
                          )}
                        </div>
                        {command.shortcut && (
                          <div className="flex items-center gap-1">
                            {command.shortcut.map((key, i) => (
                              <kbd
                                key={i}
                                className={`rounded px-1.5 py-0.5 text-xs ${
                                  isSelected
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-800 text-gray-400'
                                }`}
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-700 px-4 py-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-gray-800 px-1.5 py-0.5">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-gray-800 px-1.5 py-0.5">↵</kbd>
                Select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-gray-800 px-1.5 py-0.5">⌘</kbd>
              <kbd className="rounded bg-gray-800 px-1.5 py-0.5">K</kbd>
              Toggle
            </span>
          </div>
        </div>
      </div>
    </CommandPaletteContext.Provider>
  );
}

// Provider wrapper for global access
export function CommandPaletteProvider({
  children,
  ...props
}: { children: React.ReactNode } & CommandPaletteProps) {
  return (
    <>
      <CommandPalette {...props} />
      {children}
    </>
  );
}

// Hook to register commands from other components
export function useRegisterCommand(command: Command) {
  const { registerCommand, unregisterCommand } = useCommandPalette();

  useEffect(() => {
    registerCommand(command);
    return () => unregisterCommand(command.id);
  }, [command, registerCommand, unregisterCommand]);
}

export default CommandPalette;
