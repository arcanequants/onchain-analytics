/**
 * Input Component Stories
 * Phase 4, Week 8 - Internal Tools & DX Checklist
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Simple input component for Storybook demo
const Input = ({
  type = 'text',
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  icon,
  value,
  onChange,
}: {
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url';
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const inputId = React.useId();

  return (
    <div className="w-full max-w-sm">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium mb-1.5 text-gray-200">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          value={value}
          onChange={onChange}
          className={`
            w-full rounded-md border bg-gray-900 px-3 py-2 text-sm text-white
            placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:cursor-not-allowed disabled:opacity-50
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700'}
          `}
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
};

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'url'],
    },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const Required: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    error: 'Please enter a valid email address',
    type: 'email',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
  },
};

export const WithIcon: Story = {
  args: {
    placeholder: 'Search...',
    type: 'search',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
  },
};

export const Number: Story = {
  args: {
    label: 'Amount',
    type: 'number',
    placeholder: '0.00',
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <Input placeholder="Default state" />
      <Input label="With label" placeholder="Enter value" />
      <Input label="Required" placeholder="Required field" required />
      <Input label="With error" error="This field is required" />
      <Input label="Disabled" placeholder="Cannot edit" disabled />
    </div>
  ),
};
