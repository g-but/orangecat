import { AllocationProfile } from '@/components/civic/AllocationProfile';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Allocation detail (owner).
 *
 * The same page a reader gets, deliberately: a directive is a public argument,
 * and its author should be looking at exactly what everyone else sees while
 * they decide whether it says what they mean. Drafts are visible here (and only
 * here) because RLS lets the owner read their own.
 */
export default async function AllocationDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AllocationProfile id={id} />;
}
