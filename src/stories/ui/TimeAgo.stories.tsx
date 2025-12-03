import type { Meta, StoryObj } from '@storybook/react';

// Mock TimeAgo component
const TimeAgo = ({
  date,
  locale = 'en',
  showTooltip = true,
}: {
  date: Date | string;
  locale?: string;
  showTooltip?: boolean;
}) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  let timeAgo: string;
  if (diffSecs < 60) {
    timeAgo = 'just now';
  } else if (diffMins < 60) {
    timeAgo = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}h ago`;
  } else if (diffDays < 7) {
    timeAgo = `${diffDays}d ago`;
  } else if (diffWeeks < 4) {
    timeAgo = `${diffWeeks}w ago`;
  } else if (diffMonths < 12) {
    timeAgo = `${diffMonths}mo ago`;
  } else {
    timeAgo = `${diffYears}y ago`;
  }

  const fullDate = dateObj.toLocaleString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (showTooltip) {
    return (
      <span className="text-gray-500 cursor-help" title={fullDate}>
        {timeAgo}
      </span>
    );
  }

  return <span className="text-gray-500">{timeAgo}</span>;
};

const meta: Meta<typeof TimeAgo> = {
  title: 'UI/TimeAgo',
  component: TimeAgo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TimeAgo>;

export const JustNow: Story = {
  args: {
    date: new Date(),
  },
};

export const MinutesAgo: Story = {
  args: {
    date: new Date(Date.now() - 15 * 60 * 1000),
  },
};

export const HoursAgo: Story = {
  args: {
    date: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
};

export const DaysAgo: Story = {
  args: {
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
};

export const WeeksAgo: Story = {
  args: {
    date: new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000),
  },
};

export const MonthsAgo: Story = {
  args: {
    date: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000),
  },
};

export const YearsAgo: Story = {
  args: {
    date: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
  },
};

export const WithoutTooltip: Story = {
  args: {
    date: new Date(Date.now() - 60 * 60 * 1000),
    showTooltip: false,
  },
};

export const InActivityFeed: Story = {
  render: () => {
    const activities = [
      { user: 'John Doe', action: 'created', item: 'Analysis #123', time: new Date() },
      { user: 'Jane Smith', action: 'updated', item: 'Report Q4', time: new Date(Date.now() - 15 * 60 * 1000) },
      { user: 'Bob Wilson', action: 'deleted', item: 'Draft v2', time: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { user: 'Alice Brown', action: 'commented on', item: 'Issue #45', time: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { user: 'Charlie Davis', action: 'merged', item: 'PR #78', time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    ];

    return (
      <div className="w-80 border rounded-lg divide-y">
        {activities.map((activity, i) => (
          <div key={i} className="p-3 flex justify-between items-start">
            <div className="text-sm">
              <span className="font-medium">{activity.user}</span>{' '}
              <span className="text-gray-500">{activity.action}</span>{' '}
              <span className="text-blue-600">{activity.item}</span>
            </div>
            <TimeAgo date={activity.time} />
          </div>
        ))}
      </div>
    );
  },
};

export const InTable: Story = {
  render: () => (
    <table className="border-collapse w-96">
      <thead>
        <tr className="border-b">
          <th className="text-left p-3 text-sm font-medium">File</th>
          <th className="text-left p-3 text-sm font-medium">Modified</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {[
          { name: 'document.pdf', time: new Date(Date.now() - 5 * 60 * 1000) },
          { name: 'report.xlsx', time: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          { name: 'presentation.pptx', time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { name: 'notes.txt', time: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        ].map((file) => (
          <tr key={file.name}>
            <td className="p-3 text-sm">{file.name}</td>
            <td className="p-3 text-sm">
              <TimeAgo date={file.time} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

export const AllTimeRanges: Story = {
  render: () => (
    <div className="space-y-2">
      {[
        { label: 'Just now', offset: 0 },
        { label: '5 minutes', offset: 5 * 60 * 1000 },
        { label: '1 hour', offset: 60 * 60 * 1000 },
        { label: '12 hours', offset: 12 * 60 * 60 * 1000 },
        { label: '3 days', offset: 3 * 24 * 60 * 60 * 1000 },
        { label: '2 weeks', offset: 14 * 24 * 60 * 60 * 1000 },
        { label: '2 months', offset: 60 * 24 * 60 * 60 * 1000 },
        { label: '1 year', offset: 365 * 24 * 60 * 60 * 1000 },
      ].map(({ label, offset }) => (
        <div key={label} className="flex justify-between w-48">
          <span className="text-sm text-gray-600">{label}:</span>
          <TimeAgo date={new Date(Date.now() - offset)} />
        </div>
      ))}
    </div>
  ),
};
