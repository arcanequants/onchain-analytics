/**
 * Notification Center Tests
 *
 * Phase 2, Week 6, Day 3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter } from './NotificationCenter';

describe('NotificationCenter', () => {
  describe('Rendering', () => {
    it('should render notification bell', () => {
      render(<NotificationCenter userId="user1" />);
      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<NotificationCenter userId="user1" className="custom-class" />);
      expect(screen.getByTestId('notification-bell').parentElement).toHaveClass(
        'custom-class'
      );
    });
  });

  describe('Dropdown Toggle', () => {
    it('should open dropdown when bell is clicked', async () => {
      render(<NotificationCenter userId="user1" />);

      fireEvent.click(screen.getByTestId('notification-bell'));

      await waitFor(() => {
        expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
      });
    });

    it('should close dropdown when bell is clicked again', async () => {
      render(<NotificationCenter userId="user1" />);

      const bell = screen.getByTestId('notification-bell');

      // Open
      fireEvent.click(bell);
      await waitFor(() => {
        expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
      });

      // Close
      fireEvent.click(bell);
      await waitFor(() => {
        expect(
          screen.queryByTestId('notification-dropdown')
        ).not.toBeInTheDocument();
      });
    });

    it('should show notifications header', async () => {
      render(<NotificationCenter userId="user1" />);

      fireEvent.click(screen.getByTestId('notification-bell'));

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state message', async () => {
      render(<NotificationCenter userId="user1" />);

      fireEvent.click(screen.getByTestId('notification-bell'));

      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      });
    });

    it('should show helpful hint in empty state', async () => {
      render(<NotificationCenter userId="user1" />);

      fireEvent.click(screen.getByTestId('notification-bell'));

      await waitFor(() => {
        expect(
          screen.getByText(/We'll notify you when something important happens/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label on bell button', () => {
      render(<NotificationCenter userId="user1" />);

      const bell = screen.getByTestId('notification-bell');
      expect(bell).toHaveAttribute('aria-label', 'Notifications');
    });
  });

  describe('Settings Link', () => {
    it('should not show settings link when empty', async () => {
      render(<NotificationCenter userId="user1" />);

      fireEvent.click(screen.getByTestId('notification-bell'));

      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      });

      expect(
        screen.queryByText('Notification settings')
      ).not.toBeInTheDocument();
    });
  });
});

describe('Unread Badge', () => {
  it('should not show badge when no unread notifications', () => {
    render(<NotificationCenter userId="user1" />);
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
  });
});
