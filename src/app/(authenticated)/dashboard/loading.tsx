import {
  DashboardStatSkeleton,
  PageHeaderSkeleton,
  ProjectCardSkeleton,
  GridSkeleton,
} from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8 p-4 md:p-6">
      <PageHeaderSkeleton />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardStatSkeleton />
        <DashboardStatSkeleton />
        <DashboardStatSkeleton />
        <DashboardStatSkeleton />
      </div>

      {/* Project cards grid */}
      <GridSkeleton count={4} className="grid-cols-1 md:grid-cols-2">
        <ProjectCardSkeleton />
      </GridSkeleton>
    </div>
  );
}
