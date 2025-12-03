import type { Meta, StoryObj } from '@storybook/react';

// Mock Skeleton components for Storybook
const Skeleton = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | 'none';
}) => {
  const baseClasses = 'bg-gray-200';
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

const SkeletonText = ({ lines = 3, gap = 2 }: { lines?: number; gap?: number }) => (
  <div className={`space-y-${gap}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </div>
);

const SkeletonCard = () => (
  <div className="border rounded-lg p-4 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton height={12} width="50%" />
        <Skeleton height={10} width="30%" />
      </div>
    </div>
    <SkeletonText lines={3} />
    <div className="flex gap-2">
      <Skeleton height={32} width={80} />
      <Skeleton height={32} width={80} />
    </div>
  </div>
);

const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="bg-gray-50 p-3 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} height={12} width={100} />
      ))}
    </div>
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="p-3 flex gap-4">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} height={12} width={colIdx === 0 ? 120 : 80} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const SkeletonStats = () => (
  <div className="grid grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="border rounded-lg p-4 space-y-2">
        <Skeleton height={10} width="40%" />
        <Skeleton height={24} width="60%" />
        <Skeleton height={8} width="30%" />
      </div>
    ))}
  </div>
);

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Rectangular: Story = {
  args: {
    width: 200,
    height: 100,
    variant: 'rectangular',
  },
};

export const Circular: Story = {
  args: {
    width: 64,
    height: 64,
    variant: 'circular',
  },
};

export const Text: Story = {
  render: () => (
    <div className="w-64">
      <SkeletonText lines={4} />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard />
    </div>
  ),
};

export const Table: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <SkeletonTable rows={5} cols={4} />
    </div>
  ),
};

export const Stats: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <SkeletonStats />
    </div>
  ),
};

export const Avatar: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="space-y-2">
        <Skeleton height={14} width={120} />
        <Skeleton height={10} width={80} />
      </div>
    </div>
  ),
};

export const MediaCard: Story = {
  render: () => (
    <div className="w-72 border rounded-lg overflow-hidden">
      <Skeleton height={160} />
      <div className="p-4 space-y-3">
        <Skeleton height={16} width="80%" />
        <SkeletonText lines={2} />
        <div className="flex justify-between items-center pt-2">
          <Skeleton height={12} width={60} />
          <Skeleton height={28} width={70} />
        </div>
      </div>
    </div>
  ),
};

export const ProfilePage: Story = {
  render: () => (
    <div className="space-y-6 max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="flex-1 space-y-2">
          <Skeleton height={20} width="40%" />
          <Skeleton height={12} width="60%" />
          <Skeleton height={12} width="30%" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton height={24} width={60} className="mx-auto" />
            <Skeleton height={10} width={40} className="mx-auto" />
          </div>
        ))}
      </div>
      {/* Bio */}
      <div className="space-y-2">
        <Skeleton height={12} width="100%" />
        <Skeleton height={12} width="90%" />
        <Skeleton height={12} width="70%" />
      </div>
      {/* Actions */}
      <div className="flex gap-3">
        <Skeleton height={36} width={100} />
        <Skeleton height={36} width={100} />
      </div>
    </div>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div className="space-y-6">
      <SkeletonStats />
      <div className="grid grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <Skeleton height={16} width={120} className="mb-4" />
          <Skeleton height={200} />
        </div>
        <div className="border rounded-lg p-4">
          <Skeleton height={16} width={120} className="mb-4" />
          <SkeletonTable rows={4} cols={3} />
        </div>
      </div>
    </div>
  ),
};
