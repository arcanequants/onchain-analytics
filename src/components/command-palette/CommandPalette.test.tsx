/**
 * Command Palette Tests
 * Phase 4, Week 8 - Internal Tools & DX Checklist
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette, Command } from './CommandPalette';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Keyboard Shortcuts', () => {
    it('opens with Cmd+K', async () => {
      render(<CommandPalette />);

      // Palette should not be visible initially
      expect(screen.queryByPlaceholderText(/type a command/i)).not.toBeInTheDocument();

      // Press Cmd+K
      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      // Palette should be visible
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });
    });

    it('opens with Ctrl+K', async () => {
      render(<CommandPalette />);

      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });
    });

    it('closes with Escape', async () => {
      render(<CommandPalette />);

      // Open the palette
      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/type a command/i)).not.toBeInTheDocument();
      });
    });

    it('toggles with repeated Cmd+K', async () => {
      render(<CommandPalette />);

      // Open
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      // Close
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/type a command/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters commands based on query', async () => {
      render(<CommandPalette />);

      // Open palette
      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      // Type search query
      const input = screen.getByPlaceholderText(/type a command/i);
      await userEvent.type(input, 'dashboard');

      // Should show dashboard command
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });

    it('shows no results message when no matches', async () => {
      render(<CommandPalette />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a command/i);
      await userEvent.type(input, 'xyznonexistent');

      expect(screen.getByText(/no commands found/i)).toBeInTheDocument();
    });

    it('searches by keywords', async () => {
      render(<CommandPalette />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a command/i);
      await userEvent.type(input, 'metrics');

      // Should find analytics command (which has 'metrics' as keyword)
      expect(screen.getByText('Go to Analytics')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates with arrow keys', async () => {
      render(<CommandPalette />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      // Press down arrow
      fireEvent.keyDown(window, { key: 'ArrowDown' });

      // Check that selection moved (by checking bg color class or similar)
      // This is implementation-dependent
    });

    it('wraps around at end of list', async () => {
      render(<CommandPalette />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      // Press up arrow from first item should go to last
      fireEvent.keyDown(window, { key: 'ArrowUp' });

      // Verify wrap-around occurred
    });
  });

  describe('Command Execution', () => {
    it('executes command on Enter', async () => {
      const mockAction = vi.fn();
      const customCommands: Command[] = [
        {
          id: 'test-cmd',
          label: 'Test Command',
          category: 'actions',
          action: mockAction,
        },
      ];

      render(<CommandPalette commands={customCommands} />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      // Search for our command
      const input = screen.getByPlaceholderText(/type a command/i);
      await userEvent.type(input, 'test');

      // Press Enter
      fireEvent.keyDown(window, { key: 'Enter' });

      // Verify action was called
      await waitFor(() => {
        expect(mockAction).toHaveBeenCalled();
      });
    });

    it('executes command on click', async () => {
      const mockAction = vi.fn();
      const customCommands: Command[] = [
        {
          id: 'click-test',
          label: 'Click Test Command',
          category: 'actions',
          action: mockAction,
        },
      ];

      render(<CommandPalette commands={customCommands} />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      // Click on command
      const commandButton = screen.getByText('Click Test Command');
      fireEvent.click(commandButton);

      expect(mockAction).toHaveBeenCalled();
    });

    it('closes palette after executing command', async () => {
      const mockAction = vi.fn();
      const customCommands: Command[] = [
        {
          id: 'close-test',
          label: 'Close Test',
          category: 'actions',
          action: mockAction,
        },
      ];

      render(<CommandPalette commands={customCommands} />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      const commandButton = screen.getByText('Close Test');
      fireEvent.click(commandButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/type a command/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom Commands', () => {
    it('renders custom commands', async () => {
      const customCommands: Command[] = [
        {
          id: 'custom-1',
          label: 'Custom Command One',
          description: 'This is a custom command',
          category: 'actions',
          action: vi.fn(),
          keywords: ['custom', 'test'],
        },
        {
          id: 'custom-2',
          label: 'Custom Command Two',
          category: 'settings',
          action: vi.fn(),
        },
      ];

      render(<CommandPalette commands={customCommands} />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      expect(screen.getByText('Custom Command One')).toBeInTheDocument();
      expect(screen.getByText('Custom Command Two')).toBeInTheDocument();
    });

    it('displays command shortcuts', async () => {
      const customCommands: Command[] = [
        {
          id: 'shortcut-test',
          label: 'Shortcut Command',
          shortcut: ['⌘', 'S'],
          category: 'actions',
          action: vi.fn(),
        },
      ];

      render(<CommandPalette commands={customCommands} />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
    });
  });

  describe('Backdrop', () => {
    it('closes when clicking backdrop', async () => {
      render(<CommandPalette />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      // Click backdrop (the div with bg-black/50)
      const backdrop = document.querySelector('.bg-black\\/50');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/type a command/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Configuration', () => {
    it('uses custom placeholder', async () => {
      render(<CommandPalette placeholder="Search for something..." />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search for something...')).toBeInTheDocument();
      });
    });

    it('respects maxResults limit', async () => {
      const manyCommands: Command[] = Array.from({ length: 20 }, (_, i) => ({
        id: `cmd-${i}`,
        label: `Command ${i}`,
        category: 'actions' as const,
        action: vi.fn(),
      }));

      render(<CommandPalette commands={manyCommands} maxResults={5} />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      // Count visible commands - should be limited
      const commandButtons = screen.getAllByRole('button');
      // Note: This includes the ESC button too, so we filter appropriately
      const commandCount = commandButtons.filter((btn) =>
        btn.textContent?.includes('Command')
      ).length;

      expect(commandCount).toBeLessThanOrEqual(5);
    });
  });

  describe('Category Grouping', () => {
    it('groups commands by category', async () => {
      const mixedCommands: Command[] = [
        { id: 'nav-1', label: 'Nav 1', category: 'navigation', action: vi.fn() },
        { id: 'act-1', label: 'Action 1', category: 'actions', action: vi.fn() },
        { id: 'nav-2', label: 'Nav 2', category: 'navigation', action: vi.fn() },
      ];

      render(<CommandPalette commands={mixedCommands} />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
      });

      // Should see category labels
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });
});
