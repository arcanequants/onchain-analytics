import type { Meta, StoryObj } from '@storybook/react';
import {
  FolderIcon,
  DocumentIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChartBarIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

// Mock EmptyState component for Storybook
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizes = {
    sm: { icon: 'h-8 w-8', title: 'text-sm', desc: 'text-xs', padding: 'py-6' },
    md: { icon: 'h-12 w-12', title: 'text-base', desc: 'text-sm', padding: 'py-12' },
    lg: { icon: 'h-16 w-16', title: 'text-lg', desc: 'text-base', padding: 'py-16' },
  };

  const s = sizes[size];

  return (
    <div className={`text-center ${s.padding}`}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Icon className={`${s.icon} text-gray-400`} />
          </div>
        </div>
      )}
      <h3 className={`font-medium text-gray-900 ${s.title}`}>{title}</h3>
      {description && (
        <p className={`mt-1 text-gray-500 ${s.desc}`}>{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-4 flex justify-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoData: Story = {
  args: {
    icon: InboxIcon,
    title: 'No data yet',
    description: 'Get started by creating your first item.',
    action: { label: 'Create Item', onClick: () => console.log('Create') },
  },
};

export const NoResults: Story = {
  args: {
    icon: MagnifyingGlassIcon,
    title: 'No results found',
    description: 'Try adjusting your search or filter to find what you are looking for.',
    action: { label: 'Clear filters', onClick: () => console.log('Clear') },
  },
};

export const NoDocuments: Story = {
  args: {
    icon: DocumentIcon,
    title: 'No documents',
    description: 'Upload documents to get started with analysis.',
    action: { label: 'Upload Document', onClick: () => console.log('Upload') },
    secondaryAction: { label: 'Learn More', onClick: () => console.log('Learn') },
  },
};

export const NoTeamMembers: Story = {
  args: {
    icon: UserGroupIcon,
    title: 'No team members',
    description: 'Invite your team to collaborate on projects.',
    action: { label: 'Invite Team', onClick: () => console.log('Invite') },
  },
};

export const NoAnalytics: Story = {
  args: {
    icon: ChartBarIcon,
    title: 'No analytics data',
    description: 'Analytics will appear here once you start receiving traffic.',
  },
};

export const Small: Story = {
  args: {
    icon: FolderIcon,
    title: 'Empty folder',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    icon: InboxIcon,
    title: 'Your inbox is empty',
    description: 'All caught up! Check back later for new messages.',
    size: 'lg',
  },
};

export const WithoutIcon: Story = {
  args: {
    title: 'Nothing here yet',
    description: 'This section is empty.',
    action: { label: 'Get Started', onClick: () => console.log('Start') },
  },
};

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      <div className="border rounded-lg">
        <EmptyState
          icon={InboxIcon}
          title="No messages"
          description="Your inbox is empty"
          size="sm"
        />
      </div>
      <div className="border rounded-lg">
        <EmptyState
          icon={DocumentIcon}
          title="No documents"
          description="Upload your first document"
          size="sm"
        />
      </div>
      <div className="border rounded-lg">
        <EmptyState
          icon={UserGroupIcon}
          title="No team"
          description="Invite your team members"
          size="sm"
        />
      </div>
      <div className="border rounded-lg">
        <EmptyState
          icon={ChartBarIcon}
          title="No analytics"
          description="Data will appear soon"
          size="sm"
        />
      </div>
    </div>
  ),
};
