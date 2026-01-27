/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

interface CauseEditPageProps {
  params: Promise<{ id: string }>;
}

const causeMeta = ENTITY_REGISTRY.cause;

export default async function CauseEditPage({ params }: CauseEditPageProps) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: cause, error } = await (supabase.from(causeMeta.tableName) as any)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !cause) {
    notFound();
  }

  // Check if user can edit this cause (using userIdField from registry)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ownerField = causeMeta.userIdField as keyof typeof cause;
  if (!user || cause[ownerField] !== user.id) {
    redirect(causeMeta.basePath);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Cause</h1>
          <p className="text-lg text-gray-600">Update your cause information</p>
        </div>

        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Cause editing form will be implemented here.</p>
          <p className="text-sm text-gray-400">
            For now, you can edit causes directly in the database.
          </p>
        </div>

        <div className="flex gap-4">
          <a
            href={`/dashboard/causes/${id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ← Back to Cause
          </a>
        </div>
      </div>
    </div>
  );
}
