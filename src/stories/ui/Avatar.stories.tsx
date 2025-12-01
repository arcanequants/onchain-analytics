/**
 * Avatar Component Stories
 * Phase 4, Week 8 - Internal Tools & DX Checklist
 */

import type { Meta, StoryObj } from '@storybook/react';

// Avatar component for Storybook demo
const Avatar = ({
  src,
  alt,
  fallback,
  size = 'md',
  status,
}: {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}) => {
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  };

  const statusSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  };

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`rounded-full object-cover ${sizes[size]}`}
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-full bg-gray-700 font-medium text-white ${sizes[size]}`}
        >
          {fallback || '?'}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-gray-900 ${statusColors[status]} ${statusSizes[size]}`}
        />
      )}
    </div>
  );
};

// Avatar group component
const AvatarGroup = ({
  avatars,
  max = 4,
  size = 'md',
}: {
  avatars: Array<{ src?: string; fallback?: string; alt?: string }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}) => {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const overlapSizes = {
    xs: '-space-x-2',
    sm: '-space-x-2',
    md: '-space-x-3',
    lg: '-space-x-4',
    xl: '-space-x-5',
  };

  return (
    <div className={`flex ${overlapSizes[size]}`}>
      {visible.map((avatar, i) => (
        <div key={i} className="ring-2 ring-gray-900 rounded-full">
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div className="ring-2 ring-gray-900 rounded-full">
          <Avatar fallback={`+${remaining}`} size={size} />
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    status: {
      control: 'select',
      options: [undefined, 'online', 'offline', 'busy', 'away'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    alt: 'User avatar',
  },
};

export const WithFallback: Story = {
  args: {
    fallback: 'JD',
  },
};

export const ExtraSmall: Story = {
  args: {
    fallback: 'XS',
    size: 'xs',
  },
};

export const Small: Story = {
  args: {
    fallback: 'SM',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    fallback: 'MD',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    fallback: 'LG',
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    fallback: 'XL',
    size: 'xl',
  },
};

export const Online: Story = {
  args: {
    fallback: 'ON',
    status: 'online',
  },
};

export const Offline: Story = {
  args: {
    fallback: 'OF',
    status: 'offline',
  },
};

export const Busy: Story = {
  args: {
    fallback: 'BS',
    status: 'busy',
  },
};

export const Away: Story = {
  args: {
    fallback: 'AW',
    status: 'away',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar fallback="XS" size="xs" />
      <Avatar fallback="SM" size="sm" />
      <Avatar fallback="MD" size="md" />
      <Avatar fallback="LG" size="lg" />
      <Avatar fallback="XL" size="xl" />
    </div>
  ),
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar fallback="ON" status="online" />
      <Avatar fallback="OF" status="offline" />
      <Avatar fallback="BS" status="busy" />
      <Avatar fallback="AW" status="away" />
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup
      avatars={[
        { fallback: 'JD' },
        { fallback: 'AS' },
        { fallback: 'MK' },
        { fallback: 'LP' },
        { fallback: 'RB' },
        { fallback: 'TN' },
      ]}
      max={4}
    />
  ),
};

export const GroupSmall: Story = {
  render: () => (
    <AvatarGroup
      avatars={[
        { fallback: 'A' },
        { fallback: 'B' },
        { fallback: 'C' },
        { fallback: 'D' },
        { fallback: 'E' },
      ]}
      max={3}
      size="sm"
    />
  ),
};

export const GroupLarge: Story = {
  render: () => (
    <AvatarGroup
      avatars={[
        { fallback: 'AB' },
        { fallback: 'CD' },
        { fallback: 'EF' },
      ]}
      max={5}
      size="lg"
    />
  ),
};
