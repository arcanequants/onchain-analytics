import type { Meta, StoryObj } from '@storybook/react';
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Mock Breadcrumb component for Storybook
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const Breadcrumb = ({
  items,
  separator = 'chevron',
  showHome = true,
}: {
  items: BreadcrumbItem[];
  separator?: 'chevron' | 'slash' | 'arrow';
  showHome?: boolean;
}) => {
  const separators = {
    chevron: <ChevronRightIcon className="h-4 w-4 text-gray-400" />,
    slash: <span className="text-gray-400">/</span>,
    arrow: <span className="text-gray-400">→</span>,
  };

  const allItems = showHome
    ? [{ label: 'Home', href: '/', icon: HomeIcon }, ...items]
    : items;

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && separators[separator]}
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </a>
              ) : (
                <span
                  className={`flex items-center gap-1 text-sm ${
                    isLast ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

const meta: Meta<typeof Breadcrumb> = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings', href: '/dashboard/settings' },
      { label: 'Profile' },
    ],
  },
};

export const WithoutHome: Story = {
  args: {
    items: [
      { label: 'Products', href: '/products' },
      { label: 'Electronics', href: '/products/electronics' },
      { label: 'Laptops' },
    ],
    showHome: false,
  },
};

export const SlashSeparator: Story = {
  args: {
    items: [
      { label: 'Admin', href: '/admin' },
      { label: 'Users', href: '/admin/users' },
      { label: 'Edit User' },
    ],
    separator: 'slash',
  },
};

export const ArrowSeparator: Story = {
  args: {
    items: [
      { label: 'Docs', href: '/docs' },
      { label: 'Components', href: '/docs/components' },
      { label: 'Breadcrumb' },
    ],
    separator: 'arrow',
  },
};

export const SingleLevel: Story = {
  args: {
    items: [{ label: 'Dashboard' }],
  },
};

export const LongPath: Story = {
  args: {
    items: [
      { label: 'Organization', href: '/org' },
      { label: 'Team', href: '/org/team' },
      { label: 'Projects', href: '/org/team/projects' },
      { label: 'AI Perception', href: '/org/team/projects/ai-perception' },
      { label: 'Settings' },
    ],
  },
};

export const InPageHeader: Story = {
  render: () => (
    <div className="border-b pb-4">
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Analytics', href: '/admin/analytics' },
          { label: 'Revenue Report' },
        ]}
      />
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Revenue Report</h1>
      <p className="text-gray-500">Monthly revenue breakdown and trends</p>
    </div>
  ),
};

export const AllSeparators: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <span className="text-xs text-gray-500 block mb-1">Chevron</span>
        <Breadcrumb
          items={[{ label: 'Level 1', href: '#' }, { label: 'Level 2', href: '#' }, { label: 'Current' }]}
          separator="chevron"
        />
      </div>
      <div>
        <span className="text-xs text-gray-500 block mb-1">Slash</span>
        <Breadcrumb
          items={[{ label: 'Level 1', href: '#' }, { label: 'Level 2', href: '#' }, { label: 'Current' }]}
          separator="slash"
        />
      </div>
      <div>
        <span className="text-xs text-gray-500 block mb-1">Arrow</span>
        <Breadcrumb
          items={[{ label: 'Level 1', href: '#' }, { label: 'Level 2', href: '#' }, { label: 'Current' }]}
          separator="arrow"
        />
      </div>
    </div>
  ),
};
