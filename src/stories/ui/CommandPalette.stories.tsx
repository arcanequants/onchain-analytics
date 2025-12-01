/**
 * Command Palette Component Stories
 * Phase 4, Week 8 - Internal Tools & DX Checklist
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Simplified Command Palette for Storybook demo
const CommandPaletteDemo = ({
  isOpen: defaultOpen = true,
  placeholder = 'Type a command or search...',
}: {
  isOpen?: boolean;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const commands = [
    { id: '1', label: 'Go to Dashboard', description: 'Navigate to main dashboard', category: 'Navigation', shortcut: ['G', 'D'] },
    { id: '2', label: 'Go to Analytics', description: 'View analytics and metrics', category: 'Navigation', shortcut: ['G', 'A'] },
    { id: '3', label: 'Go to Wallets', description: 'Manage tracked wallets', category: 'Navigation', shortcut: ['G', 'W'] },
    { id: '4', label: 'Refresh Data', description: 'Refresh all data', category: 'Actions', shortcut: ['R'] },
    { id: '5', label: 'Toggle Dark Mode', description: 'Switch theme', category: 'Settings', shortcut: ['T'] },
  ];

  const filteredCommands = query
    ? commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, typeof commands>);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands.length]);

  if (!isOpen) {
    return (
      <div className="text-center">
        <p className="mb-4 text-gray-400">Press <kbd className="rounded bg-gray-800 px-2 py-1 text-sm">⌘K</kbd> to open command palette</p>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Open Command Palette
        </button>
      </div>
    );
  }

  let currentIndex = 0;

  return (
    <div className="relative">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div className="relative z-10 mx-auto max-w-xl overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-gray-700 px-4">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={placeholder}
            className="flex-1 bg-transparent py-4 text-white placeholder:text-gray-500 focus:outline-none"
            autoFocus
          />
          <kbd className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-400">ESC</kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} className="mb-2">
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500">{category}</div>
              {cmds.map((cmd) => {
                const index = currentIndex++;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={() => setIsOpen(false)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{cmd.label}</div>
                      <div className={`text-sm ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                        {cmd.description}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {cmd.shortcut.map((key, i) => (
                        <kbd
                          key={i}
                          className={`rounded px-1.5 py-0.5 text-xs ${
                            isSelected ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-700 px-4 py-2 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-gray-800 px-1.5 py-0.5">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-gray-800 px-1.5 py-0.5">↵</kbd> Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-gray-800 px-1.5 py-0.5">⌘</kbd>
            <kbd className="rounded bg-gray-800 px-1.5 py-0.5">K</kbd> Toggle
          </span>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof CommandPaletteDemo> = {
  title: 'UI/CommandPalette',
  component: CommandPaletteDemo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
  },
};

export const CustomPlaceholder: Story = {
  args: {
    isOpen: true,
    placeholder: 'Search commands, pages, and actions...',
  },
};

export const WithSearch: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true);
    const [query, setQuery] = React.useState('dash');
    const [selectedIndex] = React.useState(0);

    const commands = [
      { id: '1', label: 'Go to Dashboard', description: 'Navigate to main dashboard', category: 'Navigation', shortcut: ['G', 'D'] },
    ];

    return (
      <div className="relative">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
        <div className="relative z-10 mx-auto max-w-xl overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-gray-700 px-4">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent py-4 text-white placeholder:text-gray-500 focus:outline-none"
            />
          </div>
          <div className="p-2">
            <div className="px-2 py-1.5 text-xs font-medium text-gray-500">Navigation</div>
            {commands.map((cmd) => (
              <button
                key={cmd.id}
                className="flex w-full items-center gap-3 rounded-lg bg-blue-600 px-3 py-2.5 text-left text-white"
              >
                <div className="flex-1">
                  <div className="font-medium">{cmd.label}</div>
                  <div className="text-sm text-blue-200">{cmd.description}</div>
                </div>
                <div className="flex gap-1">
                  {cmd.shortcut.map((key, i) => (
                    <kbd key={i} className="rounded bg-blue-500 px-1.5 py-0.5 text-xs text-white">{key}</kbd>
                  ))}
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-700 px-4 py-2 text-xs text-gray-500">
            1 result found
          </div>
        </div>
      </div>
    );
  },
};

export const NoResults: Story = {
  render: () => (
    <div className="relative">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 mx-auto max-w-xl overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-gray-700 px-4">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value="xyznotfound"
            readOnly
            className="flex-1 bg-transparent py-4 text-white focus:outline-none"
          />
        </div>
        <div className="py-12 text-center text-sm text-gray-500">
          No commands found for "xyznotfound"
        </div>
      </div>
    </div>
  ),
};
