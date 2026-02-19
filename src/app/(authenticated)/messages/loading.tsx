import { ListItemSkeleton, PageHeaderSkeleton } from '@/components/ui/Skeleton';

export default function MessagesLoading() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <PageHeaderSkeleton />

      <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
      </div>
    </div>
  );
}
