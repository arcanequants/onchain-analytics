import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpSolidIcon,
  HandThumbDownIcon as HandThumbDownSolidIcon,
  StarIcon as StarSolidIcon,
} from '@heroicons/react/24/solid';

// Mock ThumbsFeedback component
const ThumbsFeedback = ({
  onFeedback,
  currentValue,
}: {
  onFeedback: (value: 'up' | 'down' | null) => void;
  currentValue?: 'up' | 'down' | null;
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Was this helpful?</span>
      <button
        onClick={() => onFeedback(currentValue === 'up' ? null : 'up')}
        className={`p-2 rounded-lg hover:bg-gray-100 ${currentValue === 'up' ? 'text-green-600' : 'text-gray-400'}`}
      >
        {currentValue === 'up' ? (
          <HandThumbUpSolidIcon className="h-5 w-5" />
        ) : (
          <HandThumbUpIcon className="h-5 w-5" />
        )}
      </button>
      <button
        onClick={() => onFeedback(currentValue === 'down' ? null : 'down')}
        className={`p-2 rounded-lg hover:bg-gray-100 ${currentValue === 'down' ? 'text-red-600' : 'text-gray-400'}`}
      >
        {currentValue === 'down' ? (
          <HandThumbDownSolidIcon className="h-5 w-5" />
        ) : (
          <HandThumbDownIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

// Mock StarRating component
const StarRating = ({
  rating,
  onRate,
  maxStars = 5,
  size = 'md',
}: {
  rating: number;
  onRate: (rating: number) => void;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const [hovered, setHovered] = useState(0);

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex gap-1">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= (hovered || rating);

        return (
          <button
            key={i}
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onRate(starValue)}
            className={`${isFilled ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform`}
          >
            {isFilled ? (
              <StarSolidIcon className={sizes[size]} />
            ) : (
              <StarIcon className={sizes[size]} />
            )}
          </button>
        );
      })}
    </div>
  );
};

// Mock FeedbackWidget component
const FeedbackWidget = ({
  type = 'thumbs',
  onSubmit,
  showComment = true,
  title = 'How was your experience?',
}: {
  type?: 'thumbs' | 'stars';
  onSubmit: (data: { rating: number | string; comment?: string }) => void;
  showComment?: boolean;
  title?: string;
}) => {
  const [rating, setRating] = useState<number | 'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    onSubmit({ rating: rating as number | string, comment });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 rounded-lg text-center">
        <p className="text-green-800 font-medium">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      <p className="text-sm font-medium text-gray-700">{title}</p>

      {type === 'thumbs' ? (
        <ThumbsFeedback
          currentValue={rating as 'up' | 'down' | null}
          onFeedback={(v) => setRating(v)}
        />
      ) : (
        <div>
          <StarRating rating={rating as number || 0} onRate={setRating} />
          {rating && <p className="text-sm text-gray-500 mt-1">{rating} out of 5 stars</p>}
        </div>
      )}

      {showComment && rating && (
        <div className="space-y-2">
          <label className="text-sm text-gray-600">Tell us more (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What could we improve?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            rows={3}
          />
        </div>
      )}

      {rating && (
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          Submit Feedback
        </button>
      )}
    </div>
  );
};

const meta: Meta<typeof FeedbackWidget> = {
  title: 'Feedback/FeedbackWidget',
  component: FeedbackWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FeedbackWidget>;

export const ThumbsFeedback_: Story = {
  render: () => {
    const [value, setValue] = useState<'up' | 'down' | null>(null);
    return <ThumbsFeedback currentValue={value} onFeedback={setValue} />;
  },
};

export const StarRating_: Story = {
  render: () => {
    const [rating, setRating] = useState(0);
    return (
      <div className="space-y-2">
        <StarRating rating={rating} onRate={setRating} />
        <p className="text-sm text-gray-500">Selected: {rating} stars</p>
      </div>
    );
  },
};

export const ThumbsWidget: Story = {
  args: {
    type: 'thumbs',
    title: 'Was this recommendation helpful?',
    onSubmit: (data) => console.log('Submitted:', data),
  },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export const StarsWidget: Story = {
  args: {
    type: 'stars',
    title: 'Rate your experience',
    onSubmit: (data) => console.log('Submitted:', data),
  },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export const WithoutComment: Story = {
  args: {
    type: 'thumbs',
    showComment: false,
    onSubmit: (data) => console.log('Submitted:', data),
  },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export const InCard: Story = {
  render: () => (
    <div className="w-96 border rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Recommendation #1</h3>
        <p className="text-sm text-gray-500 mt-1">
          Improve your meta descriptions to better match search intent.
        </p>
      </div>
      <FeedbackWidget
        type="thumbs"
        title="Was this recommendation helpful?"
        onSubmit={(data) => console.log(data)}
      />
    </div>
  ),
};

export const AfterAnalysis: Story = {
  render: () => (
    <div className="w-96 p-6 bg-white border rounded-lg space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <span className="text-2xl font-bold text-green-600">85</span>
        </div>
        <h3 className="font-semibold text-lg">Analysis Complete</h3>
        <p className="text-sm text-gray-500">Your AI Perception Score</p>
      </div>
      <hr />
      <FeedbackWidget
        type="stars"
        title="How accurate was this analysis?"
        onSubmit={(data) => console.log(data)}
      />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => {
    const [ratings, setRatings] = useState({ sm: 0, md: 0, lg: 0 });
    return (
      <div className="space-y-6">
        <div>
          <span className="text-xs text-gray-500 block mb-2">Small</span>
          <StarRating rating={ratings.sm} onRate={(r) => setRatings({ ...ratings, sm: r })} size="sm" />
        </div>
        <div>
          <span className="text-xs text-gray-500 block mb-2">Medium</span>
          <StarRating rating={ratings.md} onRate={(r) => setRatings({ ...ratings, md: r })} size="md" />
        </div>
        <div>
          <span className="text-xs text-gray-500 block mb-2">Large</span>
          <StarRating rating={ratings.lg} onRate={(r) => setRatings({ ...ratings, lg: r })} size="lg" />
        </div>
      </div>
    );
  },
};
