/**
 * Admin Shell Layout
 *
 * Phase 4, Week 8 Extended
 * Unified admin layout with sidebar navigation, command palette,
 * and keyboard shortcuts (cmd+K, cmd+B, cmd+1-9)
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CommandPalette, useCommandPalette } from '@/components/admin/CommandPalette';
import { useKeyboardShortcuts, getAdminShortcuts, formatShortcut } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp, ShortcutBadge } from '@/components/admin/KeyboardShortcutsHelp';

// ================================================================
// TYPES
// ================================================================

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// ================================================================
// ICONS
// ================================================================

function DashboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function FinanceIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function OpsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HealthIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function CostsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function QueuesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function VendorsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function NotificationsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function FlagsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

function RLHFIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

// ================================================================
// NAVIGATION CONFIG
// ================================================================

const navGroups: NavGroup[] = [
  {
    title: 'Dashboards',
    items: [
      { href: '/admin/ceo', label: 'CEO Dashboard', icon: <DashboardIcon /> },
      { href: '/admin/finance', label: 'Finance', icon: <FinanceIcon /> },
      { href: '/admin/ops', label: 'Operations', icon: <OpsIcon /> },
      { href: '/admin/health', label: 'Health', icon: <HealthIcon /> },
      { href: '/admin/costs', label: 'Costs', icon: <CostsIcon /> },
    ],
  },
  {
    title: 'Infrastructure',
    items: [
      { href: '/admin/queues', label: 'Queues', icon: <QueuesIcon />, badge: 3, badgeColor: 'bg-yellow-500' },
      { href: '/admin/vendors', label: 'Vendors', icon: <VendorsIcon /> },
      { href: '/admin/feature-flags', label: 'Feature Flags', icon: <FlagsIcon /> },
    ],
  },
  {
    title: 'AI & RLHF',
    items: [
      { href: '/admin/rlhf/corrections', label: 'Corrections', icon: <RLHFIcon />, badge: 5, badgeColor: 'bg-blue-500' },
      { href: '/admin/rlhf/calibration', label: 'Calibration', icon: <RLHFIcon /> },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { href: '/admin/notifications', label: 'Notifications', icon: <NotificationsIcon />, badge: 2, badgeColor: 'bg-red-500' },
      { href: '/admin/audit', label: 'Audit Log', icon: <AuditIcon /> },
    ],
  },
];

// ================================================================
// SIDEBAR COMPONENT
// ================================================================

function Sidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { open: openCommandPalette } = useCommandPalette();

  return (
    <aside className={`fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-800 transition-all duration-300 z-40 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!isCollapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-white font-semibold">Admin</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Search Button */}
      {!isCollapsed && (
        <div className="p-4">
          <button
            onClick={openCommandPalette}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            <SearchIcon />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="px-2 py-0.5 text-xs bg-gray-700 rounded border border-gray-600">
              K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100%-8rem)]">
        {navGroups.map(group => (
          <div key={group.title}>
            {!isCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className={`px-2 py-0.5 text-xs text-white rounded-full ${item.badgeColor || 'bg-gray-600'}`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">Admin</div>
              <div className="text-xs text-gray-500 truncate">admin@example.com</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ================================================================
// LAYOUT COMPONENT
// ================================================================

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const commandPalette = useCommandPalette();
  const router = useRouter();

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  // Define keyboard shortcuts
  const shortcuts = useMemo(() => getAdminShortcuts({
    onToggleSidebar: toggleSidebar,
    onOpenCommandPalette: commandPalette.open,
    onNavigate: handleNavigate,
    onShowHelp: () => setShowShortcutsHelp(true),
    onRefresh: () => window.location.reload(),
    onEscape: () => {
      if (showShortcutsHelp) {
        setShowShortcutsHelp(false);
      } else if (commandPalette.isOpen) {
        commandPalette.close();
      }
    },
  }), [toggleSidebar, commandPalette, handleNavigate, showShortcutsHelp]);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts,
    enabled: true,
    onShortcutTriggered: (shortcut) => {
      console.log('[Keyboard] Triggered:', shortcut.description);
    },
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Top Bar */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Toggle Sidebar Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title={`Toggle sidebar (${formatShortcut('B', ['meta'])})`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>

            {/* Search Button */}
            <button
              onClick={commandPalette.open}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              <SearchIcon />
              <span className="hidden sm:inline">Quick search</span>
              <ShortcutBadge keyName="K" modifiers={['meta']} className="hidden sm:inline" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Keyboard Shortcuts Help */}
            <button
              onClick={() => setShowShortcutsHelp(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title={`Keyboard shortcuts (${formatShortcut('/', ['meta'])})`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-400 hidden md:inline">All systems operational</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <NotificationsIcon />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
}
