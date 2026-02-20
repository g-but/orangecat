import { ProfileHeaderSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <ProfileHeaderSkeleton />
    </div>
  );
}
