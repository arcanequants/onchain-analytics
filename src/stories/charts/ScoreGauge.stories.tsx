import type { Meta, StoryObj } from '@storybook/react';

// Mock ScoreGauge component for Storybook
const ScoreGauge = ({
  score,
  maxScore = 100,
  size = 180,
  showNeedle = true,
  showLabels = true,
  animated = true,
}: {
  score: number;
  maxScore?: number;
  size?: number;
  showNeedle?: boolean;
  showLabels?: boolean;
  animated?: boolean;
}) => {
  const normalizedScore = Math.min(100, Math.max(0, (score / maxScore) * 100));

  // Gauge arc spans from -135deg to 135deg (270deg total)
  const startAngle = -135;
  const endAngle = 135;
  const range = endAngle - startAngle;
  const needleAngle = startAngle + (normalizedScore / 100) * range;

  const getColor = (score: number) => {
    if (score >= 80) return { main: '#22c55e', bg: '#dcfce7' };
    if (score >= 60) return { main: '#eab308', bg: '#fef9c3' };
    if (score >= 40) return { main: '#f97316', bg: '#ffedd5' };
    return { main: '#ef4444', bg: '#fee2e2' };
  };

  const { main: color } = getColor(normalizedScore);

  const center = size / 2;
  const radius = (size - 40) / 2;
  const strokeWidth = size * 0.12;

  // Create arc path
  const polarToCartesian = (angle: number, r: number) => ({
    x: center + r * Math.cos((angle * Math.PI) / 180),
    y: center + r * Math.sin((angle * Math.PI) / 180),
  });

  const createArc = (start: number, end: number) => {
    const startPoint = polarToCartesian(start, radius);
    const endPoint = polarToCartesian(end, radius);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
  };

  const progressEnd = startAngle + (normalizedScore / 100) * range;

  return (
    <div className="relative inline-block" style={{ width: size, height: size * 0.75 }}>
      <svg width={size} height={size * 0.75} className="overflow-visible">
        {/* Background arc */}
        <path
          d={createArc(startAngle, endAngle)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress arc */}
        <path
          d={createArc(startAngle, progressEnd)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            transition: animated ? 'all 1s ease-out' : 'none',
          }}
        />

        {/* Needle */}
        {showNeedle && (
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: `${center}px ${center}px`,
              transition: animated ? 'transform 1s ease-out' : 'none',
            }}
          >
            <line
              x1={center}
              y1={center}
              x2={center + radius - strokeWidth}
              y2={center}
              stroke="#374151"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={center} cy={center} r={8} fill="#374151" />
            <circle cx={center} cy={center} r={4} fill="white" />
          </g>
        )}

        {/* Labels */}
        {showLabels && (
          <>
            <text x={center - radius - 5} y={center + 20} fontSize={12} fill="#9ca3af" textAnchor="middle">0</text>
            <text x={center} y={center - radius + 5} fontSize={12} fill="#9ca3af" textAnchor="middle">50</text>
            <text x={center + radius + 5} y={center + 20} fontSize={12} fill="#9ca3af" textAnchor="middle">100</text>
          </>
        )}
      </svg>

      {/* Score display */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ bottom: '10%' }}
      >
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-lg text-gray-400">/{maxScore}</span>
      </div>
    </div>
  );
};

const meta: Meta<typeof ScoreGauge> = {
  title: 'Charts/ScoreGauge',
  component: ScoreGauge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    score: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    size: { control: { type: 'range', min: 120, max: 300, step: 20 } },
  },
};

export default meta;
type Story = StoryObj<typeof ScoreGauge>;

export const Default: Story = {
  args: {
    score: 72,
  },
};

export const Excellent: Story = {
  args: {
    score: 92,
  },
};

export const Good: Story = {
  args: {
    score: 68,
  },
};

export const Average: Story = {
  args: {
    score: 45,
  },
};

export const Poor: Story = {
  args: {
    score: 23,
  },
};

export const Small: Story = {
  args: {
    score: 75,
    size: 120,
    showLabels: false,
  },
};

export const Large: Story = {
  args: {
    score: 85,
    size: 280,
  },
};

export const WithoutNeedle: Story = {
  args: {
    score: 78,
    showNeedle: false,
  },
};

export const CustomMax: Story = {
  args: {
    score: 750,
    maxScore: 1000,
  },
};

export const Dashboard: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-8">
      <div className="text-center">
        <ScoreGauge score={92} size={160} />
        <p className="mt-2 text-sm font-medium text-gray-700">Overall Score</p>
      </div>
      <div className="text-center">
        <ScoreGauge score={78} size={160} />
        <p className="mt-2 text-sm font-medium text-gray-700">Content Quality</p>
      </div>
      <div className="text-center">
        <ScoreGauge score={65} size={160} />
        <p className="mt-2 text-sm font-medium text-gray-700">Technical SEO</p>
      </div>
    </div>
  ),
};

export const Comparison: Story = {
  render: () => (
    <div className="flex gap-8">
      {[
        { label: 'This Month', score: 82 },
        { label: 'Last Month', score: 74 },
        { label: 'Last Year', score: 58 },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <ScoreGauge score={item.score} size={140} showLabels={false} />
          <p className="mt-2 text-sm text-gray-600">{item.label}</p>
        </div>
      ))}
    </div>
  ),
};
