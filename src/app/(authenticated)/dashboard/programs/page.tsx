import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { PROGRAM_BLUEPRINTS } from '@/config/program-blueprints';
import { ROUTES } from '@/config/routes';

export const metadata: Metadata = {
  title: 'Programs',
  description: 'Multi-entity programs you can create in one pass.',
};

/**
 * Program picker.
 *
 * Some things are not one entity. A program that ships hardware, sells
 * sponsored seats, funds free ones and hands out an AI tutor is six or eight
 * entities that only make sense together — this is where you create that set in
 * one pass instead of eight visits to eight create forms.
 */
export default function ProgramsPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-fg-primary">Programs</h1>
      <p className="mt-1 text-base text-fg-secondary">
        Some things need more than one entity. Pick a program, set the numbers, create the whole set
        at once.
      </p>

      <ul className="mt-6 divide-y divide-subtle rounded-lg border border-default bg-surface-base">
        {PROGRAM_BLUEPRINTS.map(blueprint => {
          const Icon = blueprint.icon;
          return (
            <li key={blueprint.id}>
              <Link
                href={ROUTES.DASHBOARD.PROGRAM_VIEW(blueprint.id)}
                className="flex items-start gap-3 px-3 py-4 hover:bg-surface-raised"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-subtle bg-surface-raised">
                  <Icon className="h-5 w-5 text-fg-secondary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-fg-primary">{blueprint.name}</span>
                  <span className="mt-0.5 block text-sm text-fg-secondary">
                    {blueprint.tagline}
                  </span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-fg-tertiary" />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-fg-tertiary">
        A program is only a starting set. Every entity it creates is an ordinary draft you own and
        can edit, publish or delete on its own.
      </p>
    </main>
  );
}
