import { TimelinePostSkeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton';

export default function CommunityLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-4">
        <PageHeaderSkeleton />
      </div>

      <div className="divide-y divide-gray-200">
        <TimelinePostSkeleton />
        <TimelinePostSkeleton />
        <TimelinePostSkeleton />
        <TimelinePostSkeleton />
        <TimelinePostSkeleton />
      </div>
    </div>
  );
}
