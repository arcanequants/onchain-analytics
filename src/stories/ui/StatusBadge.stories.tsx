import type { Meta, StoryObj } from '@storybook/react';

// Mock StatusBadge component for Storybook
const StatusBadge = ({
  status,
  size = 'md',
  showDot = true,
  pulse = false,
}: {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'inactive';
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  pulse?: boolean;
}) => {
  const statusConfig = {
    success: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Active' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Warning' },
    error: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'Error' },
    info: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Info' },
    pending: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', label: 'Pending' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500', label: 'Inactive' },
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${config.bg} ${config.text} ${sizes[size]}`}
    >
      {showDot && (
        <span className={`${dotSizes[size]} rounded-full ${config.dot} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {config.label}
    </span>
  );
};

const meta: Meta<typeof StatusBadge> = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Success: Story = {
  args: {
    status: 'success',
  },
};

export const Warning: Story = {
  args: {
    status: 'warning',
  },
};

export const Error: Story = {
  args: {
    status: 'error',
  },
};

export const Info: Story = {
  args: {
    status: 'info',
  },
};

export const Pending: Story = {
  args: {
    status: 'pending',
  },
};

export const Inactive: Story = {
  args: {
    status: 'inactive',
  },
};

export const WithPulse: Story = {
  args: {
    status: 'success',
    pulse: true,
  },
};

export const WithoutDot: Story = {
  args: {
    status: 'warning',
    showDot: false,
  },
};

export const Small: Story = {
  args: {
    status: 'success',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    status: 'error',
    size: 'lg',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="success" />
      <StatusBadge status="warning" />
      <StatusBadge status="error" />
      <StatusBadge status="info" />
      <StatusBadge status="pending" />
      <StatusBadge status="inactive" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <StatusBadge status="success" size="sm" />
      <StatusBadge status="success" size="md" />
      <StatusBadge status="success" size="lg" />
    </div>
  ),
};

export const InTable: Story = {
  render: () => (
    <table className="border-collapse w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left p-3 text-sm font-medium text-gray-600">Service</th>
          <th className="text-left p-3 text-sm font-medium text-gray-600">Status</th>
          <th className="text-left p-3 text-sm font-medium text-gray-600">Last Check</th>
        </tr>
      </thead>
      <tbody>
        {[
          { name: 'API Gateway', status: 'success' as const, time: '2 min ago' },
          { name: 'Database', status: 'success' as const, time: '2 min ago' },
          { name: 'Cache Server', status: 'warning' as const, time: '5 min ago' },
          { name: 'ML Pipeline', status: 'error' as const, time: '10 min ago' },
          { name: 'Backup Service', status: 'pending' as const, time: '1 hour ago' },
        ].map((service) => (
          <tr key={service.name} className="border-b">
            <td className="p-3 text-sm">{service.name}</td>
            <td className="p-3">
              <StatusBadge status={service.status} size="sm" pulse={service.status === 'error'} />
            </td>
            <td className="p-3 text-sm text-gray-500">{service.time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
