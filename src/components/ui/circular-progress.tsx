'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  radius?: number;
  className?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  percent,
  size = 192,
  strokeWidth = 6,
  radius = 42,
  className,
  children,
}: CircularProgressProps) {
  const gradientId = useId();
  const clamped = Math.min(Math.max(percent, 0), 100);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/10"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: 'drop-shadow(0 0 6px rgba(183, 124, 255, 0.65))' }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#B77CFF" />
          </linearGradient>
        </defs>
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
