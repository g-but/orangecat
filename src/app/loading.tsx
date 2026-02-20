import { Skeleton, ProjectCardSkeleton, GridSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 text-center py-16">
        <Skeleton className="h-12 w-80 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
        <Skeleton className="h-12 w-48 mx-auto rounded-full mt-4" />
      </div>
      <div className="px-4 md:px-6">
        <GridSkeleton count={6} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProjectCardSkeleton />
        </GridSkeleton>
      </div>
    </div>
  );
}
