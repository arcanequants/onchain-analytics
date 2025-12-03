import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Mock SearchInput component
const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  loading = false,
  size = 'md',
  showShortcut = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showShortcut?: boolean;
}) => {
  const sizes = {
    sm: 'pl-8 pr-8 py-1.5 text-sm',
    md: 'pl-10 pr-10 py-2 text-base',
    lg: 'pl-12 pr-12 py-3 text-lg',
  };

  const iconSizes = {
    sm: 'h-4 w-4 left-2',
    md: 'h-5 w-5 left-3',
    lg: 'h-6 w-6 left-3',
  };

  return (
    <div className="relative">
      <MagnifyingGlassIcon
        className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${iconSizes[size]}`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${sizes[size]}`}
      />
      {(value || loading) && (
        <div className={`absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-2`}>
          {loading && (
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {value && !loading && onClear && (
            <button onClick={onClear} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      {showShortcut && !value && (
        <div className="absolute top-1/2 -translate-y-1/2 right-3">
          <kbd className="px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 border border-gray-200 rounded">
            /
          </kbd>
        </div>
      )}
    </div>
  );
};

// Wrapper for interactive stories
const SearchWrapper = (props: Omit<React.ComponentProps<typeof SearchInput>, 'value' | 'onChange' | 'onClear'>) => {
  const [value, setValue] = useState('');
  return <SearchInput {...props} value={value} onChange={setValue} onClear={() => setValue('')} />;
};

const meta: Meta<typeof SearchInput> = {
  title: 'UI/SearchInput',
  component: SearchInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <SearchWrapper placeholder="Search..." />
    </div>
  ),
};

export const WithValue: Story = {
  args: {
    value: 'example search',
    onChange: () => {},
    onClear: () => {},
  },
  decorators: [(Story) => <div className="w-64"><Story /></div>],
};

export const Loading: Story = {
  args: {
    value: 'searching...',
    onChange: () => {},
    loading: true,
  },
  decorators: [(Story) => <div className="w-64"><Story /></div>],
};

export const WithShortcut: Story = {
  render: () => (
    <div className="w-64">
      <SearchWrapper showShortcut placeholder="Search or press /" />
    </div>
  ),
};

export const Small: Story = {
  render: () => (
    <div className="w-48">
      <SearchWrapper size="sm" placeholder="Search..." />
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div className="w-80">
      <SearchWrapper size="lg" placeholder="What are you looking for?" />
    </div>
  ),
};

export const InNavbar: Story = {
  render: () => (
    <nav className="flex items-center justify-between p-4 bg-gray-900 rounded-lg w-[600px]">
      <span className="text-white font-semibold">Dashboard</span>
      <div className="w-64">
        <SearchWrapper placeholder="Search..." showShortcut />
      </div>
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gray-700 rounded-full" />
      </div>
    </nav>
  ),
};

export const InSidebar: Story = {
  render: () => (
    <div className="w-64 p-4 bg-gray-50 rounded-lg space-y-4">
      <SearchWrapper size="sm" placeholder="Search menu..." />
      <nav className="space-y-1">
        {['Dashboard', 'Analytics', 'Reports', 'Settings'].map((item) => (
          <a key={item} href="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
            {item}
          </a>
        ))}
      </nav>
    </div>
  ),
};
