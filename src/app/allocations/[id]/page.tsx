import { Metadata } from 'next';
import { generateEntityMetadata } from '@/lib/seo/metadata';
import { fetchEntityForMetadata } from '@/components/public/PublicEntityDetailPage';
import { AllocationProfile } from '@/components/civic/AllocationProfile';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const entity = await fetchEntityForMetadata('allocation', id, 'title, description');
  if (!entity) {
    return { title: 'Allocation Not Found' };
  }
  return generateEntityMetadata({
    type: 'allocation',
    id,
    title: entity.title,
    description: entity.description,
  });
}

export default async function PublicAllocationPage({ params }: PageProps) {
  const { id } = await params;
  return <AllocationProfile id={id} />;
}
