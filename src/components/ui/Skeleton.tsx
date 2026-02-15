import { cn } from '@/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-primary-200 dark:bg-gray-700', className)} aria-hidden />;
}
