import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getProgramBlueprint } from '@/config/program-blueprints';
import { ROUTES } from '@/config/routes';
import { ProgramBlueprintRunner } from '@/components/programs/ProgramBlueprintRunner';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blueprint = getProgramBlueprint(id);
  return {
    title: blueprint ? blueprint.name : 'Program',
    description: blueprint?.tagline,
  };
}

export default async function ProgramBlueprintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blueprint = getProgramBlueprint(id);

  if (!blueprint) {
    notFound();
  }

  const Icon = blueprint.icon;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <Link
        href={ROUTES.DASHBOARD.PROGRAMS}
        className="inline-flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        All programs
      </Link>

      <header className="mb-6 mt-4 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-subtle bg-surface-raised">
          <Icon className="h-5 w-5 text-fg-secondary" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-fg-primary">
            {blueprint.name}
          </h1>
          <p className="mt-1 text-sm text-fg-secondary">{blueprint.summary}</p>
        </div>
      </header>

      <ProgramBlueprintRunner blueprintId={blueprint.id} />
    </main>
  );
}
