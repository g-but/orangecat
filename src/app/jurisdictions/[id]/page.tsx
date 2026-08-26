import { Metadata } from 'next';
import { generateEntityMetadata } from '@/lib/seo/metadata';
import { fetchEntityForMetadata } from '@/components/public/PublicEntityDetailPage';
import { JurisdictionProfile } from '@/components/civic/JurisdictionProfile';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const entity = await fetchEntityForMetadata('jurisdiction', id, 'title, description');
  if (!entity) {
    return { title: 'Jurisdiction Not Found' };
  }
  return generateEntityMetadata({
    type: 'jurisdiction',
    id,
    title: entity.title,
    description: entity.description,
  });
}

export default async function PublicJurisdictionPage({ params }: PageProps) {
  const { id } = await params;
  return <JurisdictionProfile id={id} />;
}
