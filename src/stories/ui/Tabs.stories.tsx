/**
 * Tabs Component Stories
 * Phase 4, Week 8 - Internal Tools & DX Checklist
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Tab components for Storybook demo
const Tabs = ({
  tabs,
  defaultTab = 0,
  variant = 'default',
}: {
  tabs: Array<{ label: string; content: React.ReactNode; disabled?: boolean }>;
  defaultTab?: number;
  variant?: 'default' | 'pills' | 'underline';
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  const variants = {
    default: {
      list: 'border-b border-gray-700',
      tab: 'px-4 py-2 -mb-px border-b-2',
      active: 'border-blue-500 text-blue-500',
      inactive: 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600',
    },
    pills: {
      list: 'gap-2',
      tab: 'px-4 py-2 rounded-md',
      active: 'bg-blue-600 text-white',
      inactive: 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
    },
    underline: {
      list: '',
      tab: 'px-4 py-2 border-b-2',
      active: 'border-blue-500 text-white',
      inactive: 'border-transparent text-gray-500 hover:text-gray-300',
    },
  };

  const styles = variants[variant];

  return (
    <div>
      <div className={`flex ${styles.list}`}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => !tab.disabled && setActiveTab(index)}
            disabled={tab.disabled}
            className={`
              ${styles.tab}
              ${activeTab === index ? styles.active : styles.inactive}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              transition-colors font-medium text-sm
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">{tabs[activeTab]?.content}</div>
    </div>
  );
};

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'pills', 'underline'],
    },
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

const sampleTabs = [
  { label: 'Overview', content: <p className="text-gray-300">Overview content goes here.</p> },
  { label: 'Settings', content: <p className="text-gray-300">Settings content goes here.</p> },
  { label: 'Analytics', content: <p className="text-gray-300">Analytics content goes here.</p> },
];

export const Default: Story = {
  args: {
    tabs: sampleTabs,
  },
};

export const Pills: Story = {
  args: {
    tabs: sampleTabs,
    variant: 'pills',
  },
};

export const Underline: Story = {
  args: {
    tabs: sampleTabs,
    variant: 'underline',
  },
};

export const WithDisabled: Story = {
  args: {
    tabs: [
      { label: 'Active', content: <p className="text-gray-300">This tab is active.</p> },
      { label: 'Also Active', content: <p className="text-gray-300">This tab is also active.</p> },
      { label: 'Disabled', content: <p className="text-gray-300">You cannot see this.</p>, disabled: true },
    ],
  },
};

export const StartOnSecond: Story = {
  args: {
    tabs: sampleTabs,
    defaultTab: 1,
  },
};

export const WithIcons: Story = {
  args: {
    tabs: [
      {
        label: '📊 Dashboard',
        content: <p className="text-gray-300">Dashboard with analytics and metrics.</p>,
      },
      {
        label: '⚙️ Settings',
        content: <p className="text-gray-300">Configure your preferences here.</p>,
      },
      {
        label: '👤 Profile',
        content: <p className="text-gray-300">Manage your profile information.</p>,
      },
    ],
    variant: 'pills',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Default</h3>
        <Tabs tabs={sampleTabs} variant="default" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Pills</h3>
        <Tabs tabs={sampleTabs} variant="pills" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Underline</h3>
        <Tabs tabs={sampleTabs} variant="underline" />
      </div>
    </div>
  ),
};

export const ManyTabs: Story = {
  args: {
    tabs: [
      { label: 'Tab 1', content: <p className="text-gray-300">Content 1</p> },
      { label: 'Tab 2', content: <p className="text-gray-300">Content 2</p> },
      { label: 'Tab 3', content: <p className="text-gray-300">Content 3</p> },
      { label: 'Tab 4', content: <p className="text-gray-300">Content 4</p> },
      { label: 'Tab 5', content: <p className="text-gray-300">Content 5</p> },
    ],
    variant: 'pills',
  },
};
