import { GroupDetail } from '@/components/groups/GroupDetail';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DashboardGroupDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <GroupDetail groupSlug={slug} />;
}
