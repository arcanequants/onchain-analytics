import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

// Mock ConfirmDialog component for Storybook
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  typeToConfirm,
  loading = false,
  icon: Icon,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  typeToConfirm?: string;
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) => {
  const [inputValue, setInputValue] = useState('');

  if (!open) return null;

  const canConfirm = typeToConfirm ? inputValue === typeToConfirm : true;

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  const iconBgStyles = {
    danger: 'bg-red-100',
    warning: 'bg-yellow-100',
    primary: 'bg-blue-100',
  };

  const iconColorStyles = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    primary: 'text-blue-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className={`p-2 rounded-full ${iconBgStyles[confirmVariant]}`}>
                <Icon className={`h-6 w-6 ${iconColorStyles[confirmVariant]}`} />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-500">{message}</p>

              {typeToConfirm && (
                <div className="mt-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Type <strong className="font-mono bg-gray-100 px-1 rounded">{typeToConfirm}</strong> to confirm:
                  </p>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder={typeToConfirm}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[confirmVariant]}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Wrapper component for interactive stories
const ConfirmDialogWrapper = (props: Omit<React.ComponentProps<typeof ConfirmDialog>, 'open' | 'onClose' | 'onConfirm'>) => {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
      >
        Open Dialog
      </button>
      {confirmed && (
        <p className="mt-4 text-green-600">Action confirmed!</p>
      )}
      <ConfirmDialog
        {...props}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          setConfirmed(true);
          setTimeout(() => setConfirmed(false), 2000);
        }}
      />
    </div>
  );
};

const meta: Meta<typeof ConfirmDialog> = {
  title: 'UI/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

export const Default: Story = {
  render: () => (
    <ConfirmDialogWrapper
      title="Confirm Action"
      message="Are you sure you want to proceed with this action?"
      icon={ExclamationTriangleIcon}
    />
  ),
};

export const DeleteConfirmation: Story = {
  render: () => (
    <ConfirmDialogWrapper
      title="Delete Item"
      message="Are you sure you want to delete this item? This action cannot be undone."
      confirmLabel="Delete"
      confirmVariant="danger"
      icon={TrashIcon}
    />
  ),
};

export const TypeToConfirm: Story = {
  render: () => (
    <ConfirmDialogWrapper
      title="Delete Account"
      message="This will permanently delete your account and all associated data. This action cannot be undone."
      confirmLabel="Delete Account"
      confirmVariant="danger"
      typeToConfirm="DELETE"
      icon={TrashIcon}
    />
  ),
};

export const Warning: Story = {
  render: () => (
    <ConfirmDialogWrapper
      title="Unsaved Changes"
      message="You have unsaved changes that will be lost if you leave this page."
      confirmLabel="Leave Anyway"
      cancelLabel="Stay on Page"
      confirmVariant="warning"
      icon={ExclamationTriangleIcon}
    />
  ),
};

export const Primary: Story = {
  render: () => (
    <ConfirmDialogWrapper
      title="Publish Changes"
      message="Your changes will be published and visible to all users immediately."
      confirmLabel="Publish"
      confirmVariant="primary"
    />
  ),
};

export const Logout: Story = {
  render: () => (
    <ConfirmDialogWrapper
      title="Sign Out"
      message="Are you sure you want to sign out of your account?"
      confirmLabel="Sign Out"
      confirmVariant="danger"
      icon={ArrowRightOnRectangleIcon}
    />
  ),
};

export const Loading: Story = {
  args: {
    open: true,
    title: 'Deleting...',
    message: 'Please wait while we delete your item.',
    confirmLabel: 'Delete',
    confirmVariant: 'danger',
    loading: true,
    icon: TrashIcon,
    onClose: () => {},
    onConfirm: () => {},
  },
};
