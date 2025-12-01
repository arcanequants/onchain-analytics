/**
 * Mobile Navigation Component Tests
 *
 * Phase 2, Week 4, Day 5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileNav, MobileNavSpacer } from './MobileNav';
import type { NavItem } from './MobileNav';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// ================================================================
// TEST DATA
// ================================================================

const mockNavItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/dashboard',
    icon: <span data-testid="home-icon">🏠</span>,
  },
  {
    id: 'analyze',
    label: 'Analyze',
    href: '/analyze',
    icon: <span data-testid="analyze-icon">🔍</span>,
  },
  {
    id: 'history',
    label: 'History',
    href: '/history',
    icon: <span data-testid="history-icon">📜</span>,
    badge: 5,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: <span data-testid="settings-icon">⚙️</span>,
  },
];

// ================================================================
// MOBILE NAV TESTS
// ================================================================

describe('MobileNav', () => {
  describe('Rendering', () => {
    it('should render mobile nav', () => {
      render(<MobileNav items={mockNavItems} />);
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    });

    it('should render all nav items', () => {
      render(<MobileNav items={mockNavItems} />);
      expect(screen.getByTestId('nav-item-home')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-analyze')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-history')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-settings')).toBeInTheDocument();
    });

    it('should display nav item labels', () => {
      render(<MobileNav items={mockNavItems} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Analyze')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should display nav item icons', () => {
      render(<MobileNav items={mockNavItems} />);
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('analyze-icon')).toBeInTheDocument();
      expect(screen.getByTestId('history-icon')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<MobileNav items={mockNavItems} className="custom-class" />);
      expect(screen.getByTestId('mobile-nav')).toHaveClass('custom-class');
    });
  });

  describe('Active State', () => {
    it('should show active indicator for current route', async () => {
      const { usePathname } = await import('next/navigation');
      vi.mocked(usePathname).mockReturnValue('/dashboard');

      render(<MobileNav items={mockNavItems} />);
      expect(screen.getByTestId('nav-indicator-home')).toBeInTheDocument();
    });

    it('should not show indicator for inactive routes', async () => {
      const { usePathname } = await import('next/navigation');
      vi.mocked(usePathname).mockReturnValue('/dashboard');

      render(<MobileNav items={mockNavItems} />);
      expect(screen.queryByTestId('nav-indicator-analyze')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-indicator-history')).not.toBeInTheDocument();
    });

    it('should match nested routes', async () => {
      const { usePathname } = await import('next/navigation');
      vi.mocked(usePathname).mockReturnValue('/dashboard/analysis/123');

      render(<MobileNav items={mockNavItems} />);
      expect(screen.getByTestId('nav-indicator-home')).toBeInTheDocument();
    });
  });

  describe('Badges', () => {
    it('should display badge when provided', () => {
      render(<MobileNav items={mockNavItems} />);
      expect(screen.getByTestId('nav-badge-history')).toBeInTheDocument();
      expect(screen.getByTestId('nav-badge-history')).toHaveTextContent('5');
    });

    it('should not display badge when not provided', () => {
      render(<MobileNav items={mockNavItems} />);
      expect(screen.queryByTestId('nav-badge-home')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-badge-analyze')).not.toBeInTheDocument();
    });

    it('should show 99+ for large badge numbers', () => {
      const itemsWithLargeBadge: NavItem[] = [
        {
          id: 'notifications',
          label: 'Notifications',
          href: '/notifications',
          icon: <span>🔔</span>,
          badge: 150,
        },
      ];
      render(<MobileNav items={itemsWithLargeBadge} />);
      expect(screen.getByTestId('nav-badge-notifications')).toHaveTextContent('99+');
    });

    it('should not show badge for zero count', () => {
      const itemsWithZeroBadge: NavItem[] = [
        {
          id: 'notifications',
          label: 'Notifications',
          href: '/notifications',
          icon: <span>🔔</span>,
          badge: 0,
        },
      ];
      render(<MobileNav items={itemsWithZeroBadge} />);
      expect(screen.queryByTestId('nav-badge-notifications')).not.toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should have correct href for each nav item', () => {
      render(<MobileNav items={mockNavItems} />);
      expect(screen.getByTestId('nav-item-home')).toHaveAttribute('href', '/dashboard');
      expect(screen.getByTestId('nav-item-analyze')).toHaveAttribute('href', '/analyze');
      expect(screen.getByTestId('nav-item-history')).toHaveAttribute('href', '/history');
      expect(screen.getByTestId('nav-item-settings')).toHaveAttribute('href', '/settings');
    });
  });

  describe('Default Items', () => {
    it('should render default nav items when none provided', () => {
      render(<MobileNav />);
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });
});

// ================================================================
// MOBILE NAV SPACER TESTS
// ================================================================

describe('MobileNavSpacer', () => {
  it('should render spacer', () => {
    render(<MobileNavSpacer />);
    expect(screen.getByTestId('mobile-nav-spacer')).toBeInTheDocument();
  });

  it('should have correct height class', () => {
    render(<MobileNavSpacer />);
    expect(screen.getByTestId('mobile-nav-spacer')).toHaveClass('h-16');
  });

  it('should be hidden on md screens', () => {
    render(<MobileNavSpacer />);
    expect(screen.getByTestId('mobile-nav-spacer')).toHaveClass('md:hidden');
  });
});
