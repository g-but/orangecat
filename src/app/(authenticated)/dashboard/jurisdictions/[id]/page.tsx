import { JurisdictionProfile } from '@/components/civic/JurisdictionProfile';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JurisdictionDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <JurisdictionProfile id={id} />;
}
