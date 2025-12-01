/**
 * Tooltip Component Stories
 * Phase 4, Week 8 - Internal Tools & DX Checklist
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Tooltip component for Storybook demo
const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 200,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-y-transparent border-l-transparent',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 ${positions[position]}`}
          role="tooltip"
        >
          <div className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white shadow-lg">
            {content}
          </div>
          <div
            className={`absolute border-4 ${arrows[position]}`}
          />
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    delay: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: (
      <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Hover me
      </button>
    ),
  },
};

export const Top: Story = {
  args: {
    content: 'Tooltip on top',
    position: 'top',
    children: (
      <button className="rounded-md bg-gray-700 px-4 py-2 text-white hover:bg-gray-600">
        Top
      </button>
    ),
  },
};

export const Bottom: Story = {
  args: {
    content: 'Tooltip on bottom',
    position: 'bottom',
    children: (
      <button className="rounded-md bg-gray-700 px-4 py-2 text-white hover:bg-gray-600">
        Bottom
      </button>
    ),
  },
};

export const Left: Story = {
  args: {
    content: 'Tooltip on left',
    position: 'left',
    children: (
      <button className="rounded-md bg-gray-700 px-4 py-2 text-white hover:bg-gray-600">
        Left
      </button>
    ),
  },
};

export const Right: Story = {
  args: {
    content: 'Tooltip on right',
    position: 'right',
    children: (
      <button className="rounded-md bg-gray-700 px-4 py-2 text-white hover:bg-gray-600">
        Right
      </button>
    ),
  },
};

export const WithIcon: Story = {
  args: {
    content: 'Click to view more info',
    children: (
      <button className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    ),
  },
};

export const LongContent: Story = {
  args: {
    content: 'This is a longer tooltip with more detailed information about the element',
    children: (
      <span className="cursor-help text-blue-400 underline underline-offset-2">
        Hover for details
      </span>
    ),
  },
};

export const NoDelay: Story = {
  args: {
    content: 'Instant tooltip',
    delay: 0,
    children: (
      <button className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">
        No delay
      </button>
    ),
  },
};

export const AllPositions: Story = {
  render: () => (
    <div className="flex items-center gap-8 p-8">
      <Tooltip content="Top tooltip" position="top">
        <button className="rounded-md bg-gray-700 px-4 py-2 text-white">Top</button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" position="bottom">
        <button className="rounded-md bg-gray-700 px-4 py-2 text-white">Bottom</button>
      </Tooltip>
      <Tooltip content="Left tooltip" position="left">
        <button className="rounded-md bg-gray-700 px-4 py-2 text-white">Left</button>
      </Tooltip>
      <Tooltip content="Right tooltip" position="right">
        <button className="rounded-md bg-gray-700 px-4 py-2 text-white">Right</button>
      </Tooltip>
    </div>
  ),
};
