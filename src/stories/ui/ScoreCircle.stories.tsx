import type { Meta, StoryObj } from '@storybook/react';

// Mock ScoreCircle component for Storybook
const ScoreCircle = ({
  score,
  size = 120,
  strokeWidth = 8,
  label,
  animated = true,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  animated?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{
            transition: animated ? 'stroke-dashoffset 1s ease-in-out' : 'none',
          }}
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-3xl font-bold" style={{ color: getColor(score) }}>
          {score}
        </span>
        {label && <span className="text-xs text-gray-500">{label}</span>}
      </div>
    </div>
  );
};

const meta: Meta<typeof ScoreCircle> = {
  title: 'UI/ScoreCircle',
  component: ScoreCircle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    score: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    size: {
      control: { type: 'range', min: 60, max: 200, step: 10 },
    },
    strokeWidth: {
      control: { type: 'range', min: 4, max: 16, step: 2 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScoreCircle>;

export const Excellent: Story = {
  args: {
    score: 92,
    label: 'Excellent',
  },
};

export const Good: Story = {
  args: {
    score: 75,
    label: 'Good',
  },
};

export const Average: Story = {
  args: {
    score: 55,
    label: 'Average',
  },
};

export const Poor: Story = {
  args: {
    score: 28,
    label: 'Needs Work',
  },
};

export const Small: Story = {
  args: {
    score: 85,
    size: 80,
    strokeWidth: 6,
  },
};

export const Large: Story = {
  args: {
    score: 85,
    size: 180,
    strokeWidth: 12,
    label: 'Overall Score',
  },
};

export const AllScores: Story = {
  render: () => (
    <div className="flex gap-8">
      <ScoreCircle score={95} label="Excellent" />
      <ScoreCircle score={72} label="Good" />
      <ScoreCircle score={48} label="Average" />
      <ScoreCircle score={25} label="Poor" />
    </div>
  ),
};
