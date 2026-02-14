import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-toss-gray-200 rounded-lg animate-pulse',
        className
      )}
    />
  );
}
