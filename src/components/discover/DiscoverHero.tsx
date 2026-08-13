import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import { DISCOVER_HERO } from '@/config/discover-tabs';

export default function DiscoverHero() {
  return (
    <section className="border-b border-default bg-surface-page">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-8 lg:px-8">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
            {DISCOVER_HERO.title}
          </h1>
          <p className="mt-1 text-base text-fg-secondary sm:text-lg">{DISCOVER_HERO.lede}</p>
        </div>
        <Link
          href={ROUTES.CREATE}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-fg-primary"
        >
          {DISCOVER_HERO.cta} →
        </Link>
      </div>
    </section>
  );
}
