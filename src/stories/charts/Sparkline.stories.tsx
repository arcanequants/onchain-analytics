import type { Meta, StoryObj } from '@storybook/react';

// Mock Sparkline component for Storybook
const Sparkline = ({
  data,
  width = 100,
  height = 32,
  color = '#3b82f6',
  showArea = false,
  strokeWidth = 1.5,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  strokeWidth?: number;
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  // Determine trend color
  const isPositive = data[data.length - 1] >= data[0];
  const trendColor = color === 'auto' ? (isPositive ? '#22c55e' : '#ef4444') : color;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {showArea && (
        <path
          d={areaD}
          fill={trendColor}
          fillOpacity={0.1}
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={trendColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r={2}
        fill={trendColor}
      />
    </svg>
  );
};

const generateRandomData = (length: number, trend: 'up' | 'down' | 'flat' | 'volatile' = 'flat') => {
  const data: number[] = [];
  let value = 50;

  for (let i = 0; i < length; i++) {
    const noise = (Math.random() - 0.5) * 10;
    switch (trend) {
      case 'up':
        value += Math.random() * 3 + noise * 0.5;
        break;
      case 'down':
        value -= Math.random() * 3 + noise * 0.5;
        break;
      case 'volatile':
        value += (Math.random() - 0.5) * 20;
        break;
      default:
        value += noise * 0.3;
    }
    data.push(Math.max(0, value));
  }

  return data;
};

const meta: Meta<typeof Sparkline> = {
  title: 'Charts/Sparkline',
  component: Sparkline,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    width: { control: { type: 'range', min: 50, max: 200, step: 10 } },
    height: { control: { type: 'range', min: 20, max: 60, step: 5 } },
    strokeWidth: { control: { type: 'range', min: 1, max: 4, step: 0.5 } },
  },
};

export default meta;
type Story = StoryObj<typeof Sparkline>;

export const Default: Story = {
  args: {
    data: generateRandomData(20, 'flat'),
    width: 100,
    height: 32,
  },
};

export const Uptrend: Story = {
  args: {
    data: generateRandomData(20, 'up'),
    color: '#22c55e',
    showArea: true,
  },
};

export const Downtrend: Story = {
  args: {
    data: generateRandomData(20, 'down'),
    color: '#ef4444',
    showArea: true,
  },
};

export const Volatile: Story = {
  args: {
    data: generateRandomData(30, 'volatile'),
    color: '#f59e0b',
  },
};

export const WithArea: Story = {
  args: {
    data: generateRandomData(20, 'up'),
    showArea: true,
    color: '#8b5cf6',
  },
};

export const Large: Story = {
  args: {
    data: generateRandomData(50, 'volatile'),
    width: 200,
    height: 48,
    strokeWidth: 2,
  },
};

export const Small: Story = {
  args: {
    data: generateRandomData(15, 'up'),
    width: 60,
    height: 20,
    strokeWidth: 1,
  },
};

export const InTableCell: Story = {
  render: () => (
    <table className="border-collapse">
      <thead>
        <tr className="border-b">
          <th className="text-left p-3 text-sm font-medium text-gray-600">Asset</th>
          <th className="text-right p-3 text-sm font-medium text-gray-600">Price</th>
          <th className="text-right p-3 text-sm font-medium text-gray-600">24h</th>
          <th className="p-3 text-sm font-medium text-gray-600">Trend</th>
        </tr>
      </thead>
      <tbody>
        {[
          { name: 'Bitcoin', price: '$97,500', change: '+2.5%', data: generateRandomData(20, 'up') },
          { name: 'Ethereum', price: '$3,650', change: '-1.2%', data: generateRandomData(20, 'down') },
          { name: 'Solana', price: '$235', change: '+5.8%', data: generateRandomData(20, 'up') },
        ].map((asset) => (
          <tr key={asset.name} className="border-b">
            <td className="p-3 text-sm font-medium">{asset.name}</td>
            <td className="p-3 text-sm text-right">{asset.price}</td>
            <td className={`p-3 text-sm text-right ${asset.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {asset.change}
            </td>
            <td className="p-3">
              <Sparkline
                data={asset.data}
                width={80}
                height={24}
                color={asset.change.startsWith('+') ? '#22c55e' : '#ef4444'}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <div className="p-4 border rounded-lg w-64">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">$45,231</p>
          <p className="text-sm text-green-600">+12.5% from last month</p>
        </div>
        <Sparkline
          data={generateRandomData(20, 'up')}
          width={80}
          height={40}
          color="#22c55e"
          showArea={true}
        />
      </div>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div className="space-y-4">
      {[
        { color: '#3b82f6', label: 'Blue' },
        { color: '#22c55e', label: 'Green' },
        { color: '#ef4444', label: 'Red' },
        { color: '#f59e0b', label: 'Amber' },
        { color: '#8b5cf6', label: 'Purple' },
        { color: '#06b6d4', label: 'Cyan' },
      ].map(({ color, label }) => (
        <div key={color} className="flex items-center gap-4">
          <span className="w-16 text-sm text-gray-600">{label}</span>
          <Sparkline
            data={generateRandomData(20, 'up')}
            width={120}
            height={32}
            color={color}
            showArea={true}
          />
        </div>
      ))}
    </div>
  ),
};
