import type { Meta, StoryObj } from '@storybook/react';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

// Mock StatsCard component for Storybook
const StatsCard = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'blue',
  loading = false,
  size = 'md',
}: {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const iconColors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  const sizes = {
    sm: { padding: 'p-4', iconSize: 'p-2', iconSvg: 'h-5 w-5', valueSize: 'text-xl', titleSize: 'text-xs' },
    md: { padding: 'p-6', iconSize: 'p-3', iconSvg: 'h-6 w-6', valueSize: 'text-2xl', titleSize: 'text-sm' },
    lg: { padding: 'p-8', iconSize: 'p-4', iconSvg: 'h-8 w-8', valueSize: 'text-3xl', titleSize: 'text-base' },
  };

  const s = sizes[size];

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${s.padding} animate-pulse`}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-8 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${s.padding} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`${s.titleSize} font-medium text-gray-500`}>{title}</p>
          <p className={`${s.valueSize} font-bold text-gray-900 mt-1`}>{value}</p>
          {(change !== undefined || changeLabel) && (
            <div className="flex items-center gap-1 mt-2">
              {change !== undefined && (
                <>
                  {change >= 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? '+' : ''}{change}%
                  </span>
                </>
              )}
              {changeLabel && (
                <span className="text-sm text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`${s.iconSize} rounded-full ${iconColors[iconColor]}`}>
            <Icon className={s.iconSvg} />
          </div>
        )}
      </div>
    </div>
  );
};

const meta: Meta<typeof StatsCard> = {
  title: 'Admin/StatsCard',
  component: StatsCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatsCard>;

export const Default: Story = {
  args: {
    title: 'Total Revenue',
    value: '$45,231',
    change: 12.5,
    changeLabel: 'from last month',
    icon: CurrencyDollarIcon,
    iconColor: 'green',
  },
};

export const Users: Story = {
  args: {
    title: 'Active Users',
    value: '2,847',
    change: 8.2,
    changeLabel: 'from last week',
    icon: UserGroupIcon,
    iconColor: 'blue',
  },
};

export const NegativeChange: Story = {
  args: {
    title: 'Bounce Rate',
    value: '32.1%',
    change: -4.3,
    changeLabel: 'from last month',
    icon: ChartBarIcon,
    iconColor: 'orange',
  },
};

export const NoChange: Story = {
  args: {
    title: 'Avg. Response Time',
    value: '245ms',
    icon: ClockIcon,
    iconColor: 'purple',
  },
};

export const Small: Story = {
  args: {
    title: 'API Calls',
    value: '12.5K',
    change: 5.2,
    icon: BoltIcon,
    iconColor: 'blue',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    title: 'Total Revenue',
    value: '$1,234,567',
    change: 24.8,
    changeLabel: 'year over year',
    icon: CurrencyDollarIcon,
    iconColor: 'green',
    size: 'lg',
  },
};

export const Loading: Story = {
  args: {
    title: '',
    value: '',
    loading: true,
  },
};

export const Dashboard: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      <StatsCard
        title="Total Revenue"
        value="$45,231"
        change={12.5}
        changeLabel="vs last month"
        icon={CurrencyDollarIcon}
        iconColor="green"
      />
      <StatsCard
        title="Active Users"
        value="2,847"
        change={8.2}
        changeLabel="vs last week"
        icon={UserGroupIcon}
        iconColor="blue"
      />
      <StatsCard
        title="Conversion Rate"
        value="3.24%"
        change={-2.1}
        changeLabel="vs last month"
        icon={ChartBarIcon}
        iconColor="purple"
      />
      <StatsCard
        title="Avg. Response"
        value="142ms"
        change={-15.3}
        changeLabel="faster"
        icon={BoltIcon}
        iconColor="orange"
      />
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div className="grid grid-cols-5 gap-4">
      {(['blue', 'green', 'purple', 'orange', 'red'] as const).map((color) => (
        <StatsCard
          key={color}
          title={color.charAt(0).toUpperCase() + color.slice(1)}
          value="1,234"
          change={5.5}
          icon={ChartBarIcon}
          iconColor={color}
          size="sm"
        />
      ))}
    </div>
  ),
};
