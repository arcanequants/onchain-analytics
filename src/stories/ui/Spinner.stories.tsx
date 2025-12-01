/**
 * Spinner Component Stories
 * Phase 4, Week 8 - Internal Tools & DX Checklist
 */

import type { Meta, StoryObj } from '@storybook/react';

// Spinner component for Storybook demo
const Spinner = ({
  size = 'md',
  color = 'primary',
  label,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  label?: string;
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colors = {
    primary: 'text-blue-500',
    secondary: 'text-gray-400',
    white: 'text-white',
  };

  return (
    <div className="flex items-center gap-2">
      <svg
        className={`animate-spin ${sizes[size]} ${colors[color]}`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && <span className={`text-sm ${colors[color]}`}>{label}</span>}
    </div>
  );
};

// Loading overlay component
const LoadingOverlay = ({
  message = 'Loading...',
}: {
  message?: string;
}) => (
  <div className="relative h-48 w-64 rounded-lg border border-gray-700 bg-gray-900">
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/80 backdrop-blur-sm rounded-lg">
      <Spinner size="lg" color="primary" />
      <span className="text-sm text-gray-300">{message}</span>
    </div>
    <div className="p-4">
      <div className="h-4 w-32 bg-gray-800 rounded mb-2" />
      <div className="h-4 w-24 bg-gray-800 rounded" />
    </div>
  </div>
);

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'white'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const Primary: Story = {
  args: {
    color: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    color: 'secondary',
  },
};

export const White: Story = {
  args: {
    color: 'white',
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-800 p-4 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export const WithLabel: Story = {
  args: {
    label: 'Loading...',
  },
};

export const WithCustomLabel: Story = {
  args: {
    label: 'Processing your request...',
    size: 'lg',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs text-gray-500">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-xs text-gray-500">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-xs text-gray-500">Large</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="xl" />
        <span className="text-xs text-gray-500">XL</span>
      </div>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner color="primary" label="Primary" />
      <Spinner color="secondary" label="Secondary" />
      <div className="bg-gray-800 p-2 rounded">
        <Spinner color="white" label="White" />
      </div>
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <button
      className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white"
      disabled
    >
      <Spinner size="sm" color="white" />
      Submitting...
    </button>
  ),
};

export const Overlay: Story = {
  render: () => <LoadingOverlay message="Loading data..." />,
};
