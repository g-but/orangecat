import { notFound } from 'next/navigation';
import { loadInitiative } from '@/data/initiatives-lazy';
import DemoPage from '@/components/pages/DemoPage';

interface DemoPageProps {
  params: Promise<{
    initiative: string;
  }>;
}

export default async function Demo({ params }: DemoPageProps) {
  const { initiative } = await params;
  const initiativeData = await loadInitiative(initiative);

  if (!initiativeData) {
    notFound();
  }

  return <DemoPage initiative={initiativeData} />;
}

export async function generateStaticParams() {
  return [{ initiative: 'projects' }, { initiative: 'fundraising' }, { initiative: 'events' }, { initiative: 'organizations' }];
}
