import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

// Mock Toggle component for Storybook
const Toggle = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
}) => {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'h-3 w-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'h-5 w-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'h-6 w-6', translate: 'translate-x-7' },
  };

  const s = sizes[size];

  return (
    <label className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex shrink-0 ${s.track} items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        <span
          className={`
            ${s.thumb} inline-block rounded-full bg-white shadow-lg
            transform transition-transform duration-200 ease-in-out
            ${checked ? s.translate : 'translate-x-0.5'}
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className={`text-sm font-medium text-gray-900 ${disabled ? 'opacity-50' : ''}`}>{label}</span>}
          {description && <span className={`text-sm text-gray-500 ${disabled ? 'opacity-50' : ''}`}>{description}</span>}
        </div>
      )}
    </label>
  );
};

// Wrapper for interactive stories
const ToggleWrapper = (props: Omit<React.ComponentProps<typeof Toggle>, 'checked' | 'onChange'> & { defaultChecked?: boolean }) => {
  const [checked, setChecked] = useState(props.defaultChecked ?? false);
  return <Toggle {...props} checked={checked} onChange={setChecked} />;
};

const meta: Meta<typeof Toggle> = {
  title: 'UI/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  render: () => <ToggleWrapper />,
};

export const Checked: Story = {
  render: () => <ToggleWrapper defaultChecked />,
};

export const WithLabel: Story = {
  render: () => <ToggleWrapper label="Enable notifications" />,
};

export const WithDescription: Story = {
  render: () => (
    <ToggleWrapper
      label="Email notifications"
      description="Receive email updates about your account activity"
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <ToggleWrapper disabled label="Disabled (off)" />
      <ToggleWrapper disabled defaultChecked label="Disabled (on)" />
    </div>
  ),
};

export const Small: Story = {
  render: () => <ToggleWrapper size="sm" label="Small toggle" />,
};

export const Large: Story = {
  render: () => <ToggleWrapper size="lg" label="Large toggle" />,
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <ToggleWrapper size="sm" defaultChecked label="Small" />
      <ToggleWrapper size="md" defaultChecked label="Medium" />
      <ToggleWrapper size="lg" defaultChecked label="Large" />
    </div>
  ),
};

export const SettingsPanel: Story = {
  render: () => (
    <div className="w-96 p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold text-gray-900">Notification Settings</h3>
      <div className="space-y-3 divide-y">
        <ToggleWrapper
          defaultChecked
          label="Push notifications"
          description="Get push notifications on your devices"
        />
        <div className="pt-3">
          <ToggleWrapper
            defaultChecked
            label="Email notifications"
            description="Receive email updates"
          />
        </div>
        <div className="pt-3">
          <ToggleWrapper
            label="SMS notifications"
            description="Get text messages for important alerts"
          />
        </div>
        <div className="pt-3">
          <ToggleWrapper
            disabled
            label="Slack integration"
            description="Connect to Slack (coming soon)"
          />
        </div>
      </div>
    </div>
  ),
};
