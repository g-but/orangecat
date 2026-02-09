import { redirect } from 'next/navigation';

interface CauseEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CauseEditPage({ params }: CauseEditPageProps) {
  const { id } = await params;
  redirect(`/dashboard/causes/create?edit=${id}`);
}
