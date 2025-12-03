import type { Meta, StoryObj } from '@storybook/react';

// Mock ProgressBar component for Storybook
const ProgressBar = ({
  value,
  max = 100,
  size = 'md',
  color = 'blue',
  showLabel = false,
  animated = true,
  striped = false,
}: {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gradient';
  showLabel?: boolean;
  animated?: boolean;
  striped?: boolean;
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4',
  };

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`
            ${heights[size]} rounded-full ${colors[color]}
            ${striped ? 'bg-stripes' : ''}
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-gray-600">
          <span>{value} / {max}</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof ProgressBar> = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    max: {
      control: { type: 'number' },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: { type: 'select' },
      options: ['blue', 'green', 'yellow', 'red', 'purple', 'gradient'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: {
    value: 65,
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    max: 100,
    showLabel: true,
  },
};

export const Small: Story = {
  args: {
    value: 50,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    value: 80,
    size: 'lg',
    showLabel: true,
  },
};

export const Green: Story = {
  args: {
    value: 90,
    color: 'green',
  },
};

export const Warning: Story = {
  args: {
    value: 45,
    color: 'yellow',
    showLabel: true,
  },
};

export const Danger: Story = {
  args: {
    value: 20,
    color: 'red',
    showLabel: true,
  },
};

export const Gradient: Story = {
  args: {
    value: 70,
    color: 'gradient',
    size: 'lg',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div>
        <span className="text-xs text-gray-500 mb-1 block">Small</span>
        <ProgressBar value={60} size="sm" />
      </div>
      <div>
        <span className="text-xs text-gray-500 mb-1 block">Medium</span>
        <ProgressBar value={60} size="md" />
      </div>
      <div>
        <span className="text-xs text-gray-500 mb-1 block">Large</span>
        <ProgressBar value={60} size="lg" />
      </div>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div className="space-y-3 w-64">
      <ProgressBar value={70} color="blue" />
      <ProgressBar value={70} color="green" />
      <ProgressBar value={70} color="yellow" />
      <ProgressBar value={70} color="red" />
      <ProgressBar value={70} color="purple" />
      <ProgressBar value={70} color="gradient" />
    </div>
  ),
};
