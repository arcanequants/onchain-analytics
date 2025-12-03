import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// Mock Select component for Storybook
const Select = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  error,
  label,
  helperText,
  size = 'md',
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full appearance-none rounded-lg border bg-white pr-10
            ${sizes[size]}
            ${error
              ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
            }
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:ring-2
          `}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Wrapper for interactive stories
const SelectWrapper = (props: Omit<React.ComponentProps<typeof Select>, 'value' | 'onChange'> & { defaultValue?: string }) => {
  const [value, setValue] = useState(props.defaultValue ?? '');
  return <Select {...props} value={value} onChange={setValue} />;
};

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
];

const planOptions = [
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter - $9/mo' },
  { value: 'pro', label: 'Professional - $29/mo' },
  { value: 'enterprise', label: 'Enterprise - Contact us', disabled: true },
];

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <SelectWrapper options={countryOptions} placeholder="Select a country" />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-64">
      <SelectWrapper
        label="Country"
        options={countryOptions}
        placeholder="Select a country"
      />
    </div>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <div className="w-64">
      <SelectWrapper
        label="Plan"
        options={planOptions}
        placeholder="Select a plan"
        helperText="You can change your plan at any time"
      />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-64">
      <SelectWrapper
        label="Country"
        options={countryOptions}
        placeholder="Select a country"
        error="Please select a country to continue"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-64">
      <SelectWrapper
        label="Country"
        options={countryOptions}
        defaultValue="us"
        disabled
      />
    </div>
  ),
};

export const Small: Story = {
  render: () => (
    <div className="w-48">
      <SelectWrapper
        options={countryOptions}
        placeholder="Country"
        size="sm"
      />
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div className="w-72">
      <SelectWrapper
        label="Select your country"
        options={countryOptions}
        placeholder="Choose..."
        size="lg"
      />
    </div>
  ),
};

export const WithDisabledOptions: Story = {
  render: () => (
    <div className="w-64">
      <SelectWrapper
        label="Select Plan"
        options={planOptions}
        placeholder="Choose a plan"
      />
    </div>
  ),
};

export const Form: Story = {
  render: () => (
    <div className="w-80 p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold">Shipping Information</h3>
      <SelectWrapper
        label="Country"
        options={countryOptions}
        placeholder="Select a country"
      />
      <SelectWrapper
        label="State/Province"
        options={[
          { value: 'ca', label: 'California' },
          { value: 'ny', label: 'New York' },
          { value: 'tx', label: 'Texas' },
        ]}
        placeholder="Select a state"
      />
      <SelectWrapper
        label="Shipping Method"
        options={[
          { value: 'standard', label: 'Standard (5-7 days)' },
          { value: 'express', label: 'Express (2-3 days)' },
          { value: 'overnight', label: 'Overnight' },
        ]}
        defaultValue="standard"
      />
    </div>
  ),
};
