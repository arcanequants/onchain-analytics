/**
 * Alert Component Stories
 * Phase 4, Week 8 - Internal Tools & DX Checklist
 */

import type { Meta, StoryObj } from '@storybook/react';

// Alert component for Storybook demo
const Alert = ({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
}: {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}) => {
  const variants = {
    info: {
      container: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    success: {
      container: 'bg-green-500/10 border-green-500/50 text-green-400',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    warning: {
      container: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    error: {
      container: 'bg-red-500/10 border-red-500/50 text-red-400',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const variantStyles = variants[variant];

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${variantStyles.container}`}>
      <div className="flex-shrink-0">{variantStyles.icon}</div>
      <div className="flex-1">
        {title && <h4 className="mb-1 font-medium">{title}</h4>}
        <p className="text-sm opacity-90">{children}</p>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded p-1 opacity-70 hover:opacity-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
    dismissible: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'This is an informational message for the user.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Your changes have been saved successfully.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Please review your settings before continuing.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'An error occurred while processing your request.',
  },
};

export const WithTitle: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This alert has a title for additional context.',
  },
};

export const Dismissible: Story = {
  args: {
    variant: 'success',
    title: 'Success!',
    children: 'This alert can be dismissed by clicking the X button.',
    dismissible: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info" title="Information">
        This is an informational alert with important details.
      </Alert>
      <Alert variant="success" title="Success">
        Your operation completed successfully.
      </Alert>
      <Alert variant="warning" title="Warning">
        Please be careful with this action.
      </Alert>
      <Alert variant="error" title="Error">
        Something went wrong. Please try again.
      </Alert>
    </div>
  ),
};

export const LongContent: Story = {
  args: {
    variant: 'warning',
    title: 'Account Verification Required',
    children:
      'Your account requires additional verification before you can access all features. Please complete the verification process by uploading a valid government-issued ID and proof of address. This process typically takes 1-2 business days.',
    dismissible: true,
  },
};
