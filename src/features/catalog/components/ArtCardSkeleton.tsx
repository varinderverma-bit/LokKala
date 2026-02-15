import { Skeleton } from '@/components/ui';

export function ArtCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-md dark:bg-gray-800">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
        <Skeleton className="mt-2 h-5 w-1/3" />
      </div>
    </div>
  );
}
