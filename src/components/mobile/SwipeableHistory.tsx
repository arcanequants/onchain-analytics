/**
 * Swipeable History Component
 *
 * Touch-friendly history list with swipe actions for mobile
 *
 * Phase 2, Week 4, Day 5
 */

'use client';

import { useState, useRef, useCallback, TouchEvent } from 'react';
import { cn } from '@/lib/utils';

// ================================================================
// TYPES
// ================================================================

export interface HistoryItem {
  id: string;
  url: string;
  brandName: string;
  score: number;
  analyzedAt: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface SwipeableHistoryProps {
  items: HistoryItem[];
  onItemClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReanalyze?: (id: string) => void;
  onShare?: (id: string) => void;
  emptyMessage?: string;
  className?: string;
}

// ================================================================
// CONSTANTS
// ================================================================

const SWIPE_THRESHOLD = 80; // pixels
const SWIPE_ACTION_WIDTH = 80; // pixels per action

// ================================================================
// SWIPEABLE ITEM COMPONENT
// ================================================================

interface SwipeableItemProps {
  item: HistoryItem;
  onItemClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReanalyze?: (id: string) => void;
  onShare?: (id: string) => void;
}

function SwipeableItem({
  item,
  onItemClick,
  onDelete,
  onReanalyze,
  onShare,
}: SwipeableItemProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwiping) return;

    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;

    // Limit swipe distance
    const maxSwipe = SWIPE_ACTION_WIDTH * 2;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setSwipeX(limitedDiff);
  }, [isSwiping]);

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false);

    // Snap to action position or reset
    if (swipeX < -SWIPE_THRESHOLD) {
      // Swiped left - show right actions
      setSwipeX(-SWIPE_ACTION_WIDTH * 2);
    } else if (swipeX > SWIPE_THRESHOLD) {
      // Swiped right - show left actions
      setSwipeX(SWIPE_ACTION_WIDTH);
    } else {
      setSwipeX(0);
    }
  }, [swipeX]);

  const handleActionClick = useCallback(
    (action: 'delete' | 'reanalyze' | 'share') => {
      setSwipeX(0);
      switch (action) {
        case 'delete':
          onDelete?.(item.id);
          break;
        case 'reanalyze':
          onReanalyze?.(item.id);
          break;
        case 'share':
          onShare?.(item.id);
          break;
      }
    },
    [item.id, onDelete, onReanalyze, onShare]
  );

  const handleItemClick = useCallback(() => {
    if (swipeX === 0) {
      onItemClick?.(item.id);
    } else {
      setSwipeX(0);
    }
  }, [swipeX, item.id, onItemClick]);

  const formattedDate = new Date(item.analyzedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const scoreColor =
    item.score >= 80
      ? 'text-green-600 dark:text-green-400'
      : item.score >= 60
        ? 'text-blue-600 dark:text-blue-400'
        : item.score >= 40
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-red-600 dark:text-red-400';

  return (
    <div
      data-testid={`swipeable-item-${item.id}`}
      className="relative overflow-hidden"
    >
      {/* Left Actions (Share) */}
      <div
        data-testid={`left-actions-${item.id}`}
        className="absolute left-0 top-0 bottom-0 flex items-center"
        style={{ width: SWIPE_ACTION_WIDTH }}
      >
        <button
          data-testid={`share-action-${item.id}`}
          onClick={() => handleActionClick('share')}
          className="flex items-center justify-center w-full h-full bg-blue-500 text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {/* Right Actions (Reanalyze, Delete) */}
      <div
        data-testid={`right-actions-${item.id}`}
        className="absolute right-0 top-0 bottom-0 flex items-center"
        style={{ width: SWIPE_ACTION_WIDTH * 2 }}
      >
        <button
          data-testid={`reanalyze-action-${item.id}`}
          onClick={() => handleActionClick('reanalyze')}
          className="flex items-center justify-center h-full bg-green-500 text-white"
          style={{ width: SWIPE_ACTION_WIDTH }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          data-testid={`delete-action-${item.id}`}
          onClick={() => handleActionClick('delete')}
          className="flex items-center justify-center h-full bg-red-500 text-white"
          style={{ width: SWIPE_ACTION_WIDTH }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div
        data-testid={`item-content-${item.id}`}
        className={cn(
          'relative bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 transition-transform',
          !isSwiping && 'transition-all duration-200'
        )}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleItemClick}
      >
        <div className="flex items-center p-4">
          {/* Score Circle */}
          <div
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg',
              item.status === 'failed'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : item.status === 'pending'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  : `bg-gray-100 dark:bg-gray-700 ${scoreColor}`
            )}
          >
            {item.status === 'failed' ? '!' : item.status === 'pending' ? '...' : item.score}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 ml-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {item.brandName}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {item.url}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {formattedDate}
            </p>
          </div>

          {/* Status/Arrow */}
          <div className="flex-shrink-0 ml-2">
            {item.status === 'pending' ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function SwipeableHistory({
  items,
  onItemClick,
  onDelete,
  onReanalyze,
  onShare,
  emptyMessage = 'No analyses yet',
  className,
}: SwipeableHistoryProps) {
  // Empty state
  if (items.length === 0) {
    return (
      <div
        data-testid="swipeable-history-empty"
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center',
          className
        )}
      >
        <svg
          className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Start by analyzing a URL
        </p>
      </div>
    );
  }

  return (
    <div data-testid="swipeable-history" className={className}>
      {/* Swipe Hint */}
      <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 text-center">
        Swipe left or right for actions
      </div>

      {/* Items List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {items.map((item) => (
          <SwipeableItem
            key={item.id}
            item={item}
            onItemClick={onItemClick}
            onDelete={onDelete}
            onReanalyze={onReanalyze}
            onShare={onShare}
          />
        ))}
      </div>
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default SwipeableHistory;
