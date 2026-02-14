'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${roundedClasses[rounded]} ${className}`}
      style={style}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-gray-200 p-4 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton width={48} height={48} rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton height={20} className="w-1/2" />
          <Skeleton height={16} className="w-3/4" />
        </div>
      </div>
      <div className="mt-4">
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

export function SkeletonMarketCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton width={40} height={40} rounded="full" />
          <div className="space-y-1">
            <Skeleton width={80} height={20} />
            <Skeleton width={120} height={14} />
          </div>
        </div>
        <Skeleton width={60} height={24} rounded="full" />
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton width={60} height={14} />
          <Skeleton width={80} height={24} />
        </div>
        <Skeleton height={8} className="w-full" rounded="full" />
      </div>

      <div className="flex gap-2">
        <Skeleton height={40} className="flex-1" rounded="lg" />
        <Skeleton height={40} className="flex-1" rounded="lg" />
      </div>
    </div>
  );
}

export function SkeletonRoundCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton width={100} height={24} />
        <Skeleton width={80} height={24} rounded="full" />
      </div>

      <div className="mb-6 text-center">
        <Skeleton width={120} height={14} className="mx-auto mb-2" />
        <Skeleton width={180} height={36} className="mx-auto" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <Skeleton width={40} height={14} className="mb-2" />
          <Skeleton width={80} height={24} />
        </div>
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <Skeleton width={40} height={14} className="mb-2" />
          <Skeleton width={80} height={24} />
        </div>
      </div>

      <div className="flex gap-2">
        <Skeleton height={48} className="flex-1" rounded="lg" />
        <Skeleton height={48} className="flex-1" rounded="lg" />
      </div>
    </div>
  );
}

export default Skeleton;
