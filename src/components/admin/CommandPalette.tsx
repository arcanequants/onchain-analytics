/**
 * Command Palette Component
 *
 * Phase 4, Week 8 Extended
 * cmd+K fuzzy search for admin navigation
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ================================================================
// TYPES
// ================================================================

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: string;
  category: 'navigation' | 'action' | 'search' | 'recent';
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

interface CommandCategory {
  name: string;
  items: CommandItem[];
}

// ================================================================
// FUZZY SEARCH
// ================================================================

function fuzzyMatch(query: string, target: string): number {
  if (!query) return 1;

  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  // Exact match gets highest score
  if (targetLower === queryLower) return 100;

  // Starts with gets high score
  if (targetLower.startsWith(queryLower)) return 80;

  // Contains gets medium score
  if (targetLower.includes(queryLower)) return 60;

  // Fuzzy character matching
  let queryIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < targetLower.length && queryIndex < queryLower.length; i++) {
    if (targetLower[i] === queryLower[queryIndex]) {
      score += 1 + consecutiveMatches * 2;
      consecutiveMatches++;
      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
  }

  // All characters matched
  if (queryIndex === queryLower.length) {
    return Math.min(50, score);
  }

  return 0;
}

function searchCommands(commands: CommandItem[], query: string): CommandItem[] {
  if (!query.trim()) {
    return commands.slice(0, 10);
  }

  const scored = commands.map(cmd => {
    const titleScore = fuzzyMatch(query, cmd.title);
    const descScore = cmd.description ? fuzzyMatch(query, cmd.description) * 0.5 : 0;
    const keywordScore = cmd.keywords
      ? Math.max(...cmd.keywords.map(k => fuzzyMatch(query, k))) * 0.7
      : 0;

    return {
      command: cmd,
      score: Math.max(titleScore, descScore, keywordScore),
    };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(s => s.command);
}

// ================================================================
// ICONS
// ================================================================

function getIcon(icon: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    dashboard: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    chart: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    cog: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    shield: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    bell: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    currency: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    clipboard: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    queue: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    flag: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
    brain: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    health: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    truck: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    search: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    plus: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    refresh: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    download: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  };

  return iconMap[icon] || iconMap.dashboard;
}

// ================================================================
// COMMAND PALETTE COMPONENT
// ================================================================

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Define all commands
  const allCommands = useMemo<CommandItem[]>(() => [
    // Navigation
    {
      id: 'nav-ceo',
      title: 'CEO Dashboard',
      description: 'Executive overview and OKRs',
      icon: 'dashboard',
      category: 'navigation',
      shortcut: '1',
      action: () => router.push('/admin/ceo'),
      keywords: ['executive', 'okr', 'metrics', 'kpi'],
    },
    {
      id: 'nav-finance',
      title: 'Finance Dashboard',
      description: 'MRR, ARR, NRR and SaaS metrics',
      icon: 'currency',
      category: 'navigation',
      shortcut: '2',
      action: () => router.push('/admin/finance'),
      keywords: ['mrr', 'arr', 'revenue', 'billing', 'cfo'],
    },
    {
      id: 'nav-ops',
      title: 'Operations Dashboard',
      description: 'SLAs, automation, and capacity',
      icon: 'truck',
      category: 'navigation',
      shortcut: '3',
      action: () => router.push('/admin/ops'),
      keywords: ['coo', 'operations', 'sla', 'cron'],
    },
    {
      id: 'nav-health',
      title: 'Health Dashboard',
      description: 'System health and status',
      icon: 'health',
      category: 'navigation',
      shortcut: '4',
      action: () => router.push('/admin/health'),
      keywords: ['status', 'uptime', 'monitoring'],
    },
    {
      id: 'nav-costs',
      title: 'Cost Dashboard',
      description: 'AI provider costs and usage',
      icon: 'chart',
      category: 'navigation',
      shortcut: '5',
      action: () => router.push('/admin/costs'),
      keywords: ['spending', 'api', 'openai', 'anthropic'],
    },
    {
      id: 'nav-queues',
      title: 'Queue Management',
      description: 'Job queues and workers',
      icon: 'queue',
      category: 'navigation',
      shortcut: '6',
      action: () => router.push('/admin/queues'),
      keywords: ['jobs', 'workers', 'background'],
    },
    {
      id: 'nav-vendors',
      title: 'Vendor Status',
      description: 'Third-party service status',
      icon: 'shield',
      category: 'navigation',
      shortcut: '7',
      action: () => router.push('/admin/vendors'),
      keywords: ['services', 'providers', 'integrations'],
    },
    {
      id: 'nav-notifications',
      title: 'Notifications',
      description: 'System alerts and notifications',
      icon: 'bell',
      category: 'navigation',
      shortcut: '8',
      action: () => router.push('/admin/notifications'),
      keywords: ['alerts', 'messages'],
    },
    {
      id: 'nav-audit',
      title: 'Audit Log',
      description: 'Activity and change history',
      icon: 'clipboard',
      category: 'navigation',
      shortcut: '9',
      action: () => router.push('/admin/audit'),
      keywords: ['history', 'logs', 'changes'],
    },
    {
      id: 'nav-rlhf',
      title: 'RLHF Corrections',
      description: 'Review and approve corrections',
      icon: 'brain',
      category: 'navigation',
      action: () => router.push('/admin/rlhf/corrections'),
      keywords: ['ai', 'feedback', 'training'],
    },
    {
      id: 'nav-flags',
      title: 'Feature Flags',
      description: 'Manage feature rollouts',
      icon: 'flag',
      category: 'navigation',
      action: () => router.push('/admin/feature-flags'),
      keywords: ['features', 'rollout', 'toggles'],
    },
    // Actions
    {
      id: 'action-refresh',
      title: 'Refresh Data',
      description: 'Reload current page data',
      icon: 'refresh',
      category: 'action',
      shortcut: 'R',
      action: () => window.location.reload(),
      keywords: ['reload', 'update'],
    },
    {
      id: 'action-export',
      title: 'Export Report',
      description: 'Download current view as CSV',
      icon: 'download',
      category: 'action',
      action: () => {
        // Placeholder for export functionality
        console.log('Export initiated');
        onClose();
      },
      keywords: ['csv', 'download', 'excel'],
    },
    {
      id: 'action-new-analysis',
      title: 'New Analysis',
      description: 'Start a new URL analysis',
      icon: 'plus',
      category: 'action',
      action: () => router.push('/'),
      keywords: ['analyze', 'scan', 'url'],
    },
    // Search
    {
      id: 'search-users',
      title: 'Search Users',
      description: 'Find users by email or name',
      icon: 'users',
      category: 'search',
      action: () => router.push('/admin/users'),
      keywords: ['customers', 'accounts'],
    },
    {
      id: 'search-analyses',
      title: 'Search Analyses',
      description: 'Find analyses by URL or ID',
      icon: 'search',
      category: 'search',
      action: () => router.push('/admin/analyses'),
      keywords: ['results', 'scans'],
    },
  ], [router, onClose]);

  // Filter commands based on query
  const filteredCommands = useMemo(() =>
    searchCommands(allCommands, query),
    [allCommands, query]
  );

  // Group commands by category
  const groupedCommands = useMemo<CommandCategory[]>(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });

    const categoryOrder = ['recent', 'navigation', 'action', 'search'];
    const categoryNames: Record<string, string> = {
      recent: 'Recent',
      navigation: 'Navigation',
      action: 'Actions',
      search: 'Search',
    };

    return categoryOrder
      .filter(cat => groups[cat]?.length)
      .map(cat => ({
        name: categoryNames[cat],
        items: groups[cat],
      }));
  }, [filteredCommands]);

  // Flatten for keyboard navigation
  const flatCommands = useMemo(() =>
    groupedCommands.flatMap(g => g.items),
    [groupedCommands]
  );

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          flatCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [flatCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
            />
            <kbd className="px-2 py-1 text-xs text-gray-500 bg-gray-800 rounded border border-gray-700">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
            {groupedCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No results found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              groupedCommands.map((group, groupIndex) => (
                <div key={group.name}>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {group.name}
                  </div>
                  {group.items.map((cmd, itemIndex) => {
                    const flatIndex = groupedCommands
                      .slice(0, groupIndex)
                      .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;
                    const isSelected = flatIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        data-index={flatIndex}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <span className={isSelected ? 'text-white' : 'text-gray-400'}>
                          {getIcon(cmd.icon)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{cmd.title}</div>
                          {cmd.description && (
                            <div className={`text-xs truncate ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className={`px-2 py-0.5 text-xs rounded ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-800 text-gray-500 border border-gray-700'
                          }`}>
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">↵</kbd>
                select
              </span>
            </div>
            <span>cmd+K to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// COMMAND PALETTE PROVIDER
// ================================================================

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}

export default CommandPalette;
