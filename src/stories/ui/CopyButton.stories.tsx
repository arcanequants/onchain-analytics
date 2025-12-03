import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

// Mock CopyButton component
const CopyButton = ({
  text,
  label = 'Copy',
  copiedLabel = 'Copied!',
  size = 'md',
  variant = 'default',
  showLabel = true,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showLabel?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text]);

  const sizes = {
    sm: { button: 'px-2 py-1 text-xs gap-1', icon: 'h-3 w-3' },
    md: { button: 'px-3 py-1.5 text-sm gap-1.5', icon: 'h-4 w-4' },
    lg: { button: 'px-4 py-2 text-base gap-2', icon: 'h-5 w-5' },
  };

  const variants = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-500',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center rounded-lg transition-colors ${sizes[size].button} ${variants[variant]}`}
    >
      {copied ? (
        <>
          <CheckIcon className={`${sizes[size].icon} text-green-600`} />
          {showLabel && <span className="text-green-600">{copiedLabel}</span>}
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className={sizes[size].icon} />
          {showLabel && <span>{label}</span>}
        </>
      )}
    </button>
  );
};

const meta: Meta<typeof CopyButton> = {
  title: 'UI/CopyButton',
  component: CopyButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

export const Default: Story = {
  args: {
    text: 'Hello, World!',
  },
};

export const IconOnly: Story = {
  args: {
    text: 'Copy me!',
    showLabel: false,
  },
};

export const Small: Story = {
  args: {
    text: 'Small button',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    text: 'Large button',
    size: 'lg',
  },
};

export const Ghost: Story = {
  args: {
    text: 'Ghost variant',
    variant: 'ghost',
  },
};

export const Outline: Story = {
  args: {
    text: 'Outline variant',
    variant: 'outline',
  },
};

export const CustomLabels: Story = {
  args: {
    text: 'API Key: sk_live_xxx',
    label: 'Copy API Key',
    copiedLabel: 'API Key Copied!',
  },
};

export const InCodeBlock: Story = {
  render: () => (
    <div className="relative bg-gray-900 rounded-lg p-4 w-96">
      <div className="absolute top-2 right-2">
        <CopyButton
          text="npm install @ai-perception/sdk"
          variant="ghost"
          showLabel={false}
          size="sm"
        />
      </div>
      <pre className="text-green-400 text-sm font-mono">
        npm install @ai-perception/sdk
      </pre>
    </div>
  ),
};

export const WithInput: Story = {
  render: () => (
    <div className="flex gap-2 w-80">
      <input
        type="text"
        readOnly
        value="https://api.example.com/v1/analyze"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50"
      />
      <CopyButton text="https://api.example.com/v1/analyze" showLabel={false} />
    </div>
  ),
};

export const ApiKeyDisplay: Story = {
  render: () => (
    <div className="p-4 border rounded-lg w-96 space-y-2">
      <label className="text-sm font-medium text-gray-700">API Key</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono text-sm truncate">
          sk_live_1234567890abcdefghij
        </code>
        <CopyButton
          text="sk_live_1234567890abcdefghij"
          label="Copy"
          copiedLabel="Copied!"
          variant="outline"
          size="sm"
        />
      </div>
      <p className="text-xs text-gray-500">Keep this key secure and never share it publicly.</p>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <CopyButton text="default" variant="default" />
        <CopyButton text="ghost" variant="ghost" />
        <CopyButton text="outline" variant="outline" />
      </div>
      <div className="flex gap-4">
        <CopyButton text="small" size="sm" />
        <CopyButton text="medium" size="md" />
        <CopyButton text="large" size="lg" />
      </div>
    </div>
  ),
};
