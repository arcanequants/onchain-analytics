import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

// Mock Dropdown component for Storybook
const Dropdown = ({
  trigger,
  items,
  align = 'left',
}: {
  trigger: React.ReactNode;
  items: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
    divider?: boolean;
  }[];
  align?: 'left' | 'right';
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute z-20 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {items.map((item, idx) => {
              if (item.divider) {
                return <hr key={idx} className="my-1 border-gray-200" />;
              }

              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left
                    ${item.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}
                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const meta: Meta<typeof Dropdown> = {
  title: 'UI/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  args: {
    trigger: (
      <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
        Options
        <ChevronDownIcon className="h-4 w-4" />
      </button>
    ),
    items: [
      { label: 'Edit', icon: PencilIcon, onClick: () => console.log('Edit') },
      { label: 'Duplicate', icon: DocumentDuplicateIcon, onClick: () => console.log('Duplicate') },
      { divider: true, label: '' },
      { label: 'Delete', icon: TrashIcon, variant: 'danger', onClick: () => console.log('Delete') },
    ],
  },
};

export const UserMenu: Story = {
  args: {
    trigger: (
      <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          JD
        </div>
        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
      </button>
    ),
    items: [
      { label: 'Profile', icon: UserIcon, onClick: () => console.log('Profile') },
      { label: 'Settings', icon: Cog6ToothIcon, onClick: () => console.log('Settings') },
      { divider: true, label: '' },
      { label: 'Sign out', icon: ArrowRightOnRectangleIcon, onClick: () => console.log('Sign out') },
    ],
    align: 'right',
  },
};

export const WithDisabledItems: Story = {
  args: {
    trigger: (
      <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
        Actions
        <ChevronDownIcon className="h-4 w-4" />
      </button>
    ),
    items: [
      { label: 'Edit', icon: PencilIcon, onClick: () => console.log('Edit') },
      { label: 'Duplicate', icon: DocumentDuplicateIcon, disabled: true },
      { label: 'Archive', disabled: true },
      { divider: true, label: '' },
      { label: 'Delete', icon: TrashIcon, variant: 'danger' },
    ],
  },
};

export const SimpleMenu: Story = {
  args: {
    trigger: (
      <button className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
        More options
      </button>
    ),
    items: [
      { label: 'Option 1', onClick: () => console.log('1') },
      { label: 'Option 2', onClick: () => console.log('2') },
      { label: 'Option 3', onClick: () => console.log('3') },
    ],
  },
};

export const IconButton: Story = {
  args: {
    trigger: (
      <button className="p-2 hover:bg-gray-100 rounded-full">
        <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="18" r="2" />
        </svg>
      </button>
    ),
    items: [
      { label: 'Edit', icon: PencilIcon },
      { label: 'Duplicate', icon: DocumentDuplicateIcon },
      { divider: true, label: '' },
      { label: 'Delete', icon: TrashIcon, variant: 'danger' },
    ],
    align: 'right',
  },
};
