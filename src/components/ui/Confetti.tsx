/**
 * Confetti Celebration Component
 *
 * Phase 1, Week 2, Day 2
 * Triggered when user achieves score > 80 (Excellent grade).
 */

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';

// ================================================================
// TYPES
// ================================================================

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  speedX: number;
  speedY: number;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'strip';
  opacity: number;
}

export interface ConfettiProps {
  /** Whether confetti is active */
  active?: boolean;
  /** Number of confetti pieces */
  particleCount?: number;
  /** Duration in ms before fading out */
  duration?: number;
  /** Colors for confetti */
  colors?: string[];
  /** Callback when animation ends */
  onComplete?: () => void;
  /** Origin point (0-1 ratio of screen) */
  origin?: { x: number; y: number };
  /** CSS class name */
  className?: string;
}

// ================================================================
// CONSTANTS
// ================================================================

const DEFAULT_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

const SHAPES: ConfettiPiece['shape'][] = ['square', 'circle', 'strip'];

// ================================================================
// UTILITIES
// ================================================================

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createConfettiPiece(
  id: number,
  originX: number,
  originY: number,
  colors: string[]
): ConfettiPiece {
  const angle = randomBetween(0, Math.PI * 2);
  const velocity = randomBetween(5, 15);

  return {
    id,
    x: originX,
    y: originY,
    rotation: randomBetween(0, 360),
    rotationSpeed: randomBetween(-15, 15),
    speedX: Math.cos(angle) * velocity,
    speedY: Math.sin(angle) * velocity - randomBetween(5, 10),
    color: randomChoice(colors),
    size: randomBetween(6, 12),
    shape: randomChoice(SHAPES),
    opacity: 1,
  };
}

// ================================================================
// HOOK: useConfetti
// ================================================================

export interface UseConfettiOptions {
  particleCount?: number;
  colors?: string[];
  duration?: number;
  origin?: { x: number; y: number };
  onComplete?: () => void;
}

export function useConfetti(options: UseConfettiOptions = {}) {
  const [isActive, setIsActive] = useState(false);

  const fire = useCallback(() => {
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    fire,
    stop,
    ConfettiComponent: (props: Partial<ConfettiProps>) => (
      <Confetti
        {...options}
        {...props}
        active={isActive}
        onComplete={() => {
          setIsActive(false);
          options.onComplete?.();
          props.onComplete?.();
        }}
      />
    ),
  };
}

// ================================================================
// COMPONENT
// ================================================================

export function Confetti({
  active = false,
  particleCount = 100,
  duration = 3000,
  colors = DEFAULT_COLORS,
  onComplete,
  origin = { x: 0.5, y: 0.4 },
  className = '',
}: ConfettiProps): React.ReactElement | null {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize confetti pieces when activated
  useEffect(() => {
    if (active) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const originX = rect.width * origin.x;
      const originY = rect.height * origin.y;

      const newPieces = Array.from({ length: particleCount }, (_, i) =>
        createConfettiPiece(i, originX, originY, colors)
      );

      setPieces(newPieces);
      startTimeRef.current = performance.now();
    } else {
      setPieces([]);
      startTimeRef.current = null;
    }
  }, [active, particleCount, colors, origin.x, origin.y]);

  // Animation loop
  useEffect(() => {
    if (!active || pieces.length === 0) return;

    const gravity = 0.3;
    const friction = 0.99;
    const fadeStart = duration * 0.7;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const fadeProgress = Math.max(0, (elapsed - fadeStart) / (duration - fadeStart));

      setPieces((currentPieces) =>
        currentPieces.map((piece) => ({
          ...piece,
          x: piece.x + piece.speedX,
          y: piece.y + piece.speedY,
          rotation: piece.rotation + piece.rotationSpeed,
          speedX: piece.speedX * friction,
          speedY: piece.speedY * friction + gravity,
          opacity: Math.max(0, 1 - fadeProgress),
        }))
      );

      if (elapsed < duration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setPieces([]);
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, pieces.length, duration, onComplete]);

  if (!active && pieces.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none overflow-hidden z-50 ${className}`}
      data-testid="confetti-container"
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <ConfettiPieceElement key={piece.id} piece={piece} />
      ))}
    </div>
  );
}

// ================================================================
// CONFETTI PIECE ELEMENT
// ================================================================

function ConfettiPieceElement({ piece }: { piece: ConfettiPiece }): React.ReactElement {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: piece.x,
    top: piece.y,
    width: piece.shape === 'strip' ? piece.size * 0.4 : piece.size,
    height: piece.shape === 'strip' ? piece.size * 1.5 : piece.size,
    backgroundColor: piece.color,
    borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'strip' ? '2px' : '2px',
    transform: `rotate(${piece.rotation}deg)`,
    opacity: piece.opacity,
    willChange: 'transform, opacity',
  };

  return <div style={style} />;
}

// ================================================================
// CELEBRATION WRAPPER
// ================================================================

export interface ScoreCelebrationProps {
  score: number;
  threshold?: number;
  children: React.ReactNode;
  onCelebrationComplete?: () => void;
}

/**
 * Wrapper component that triggers confetti when score exceeds threshold
 */
export function ScoreCelebration({
  score,
  threshold = 80,
  children,
  onCelebrationComplete,
}: ScoreCelebrationProps): React.ReactElement {
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (score >= threshold && !hasCelebrated) {
      // Small delay for effect
      const timeout = setTimeout(() => {
        setShowConfetti(true);
        setHasCelebrated(true);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [score, threshold, hasCelebrated]);

  const handleComplete = () => {
    setShowConfetti(false);
    onCelebrationComplete?.();
  };

  return (
    <>
      {children}
      <Confetti
        active={showConfetti}
        particleCount={150}
        duration={4000}
        onComplete={handleComplete}
      />
    </>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default Confetti;
