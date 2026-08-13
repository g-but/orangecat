import Link from 'next/link';
import { FIRST_MOVES } from '@/config/landing-page';

/**
 * Three next actions. Replaces the six-section marketing essay that used to
 * sit under the hero — visitors should not have to read to find a first move.
 */
export default function FirstMoveSection() {
  return (
    <section className="py-10 sm:py-14 bg-surface-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FIRST_MOVES.map(move => (
            <li key={move.id}>
              <Link
                href={move.href}
                className="oc-surface oc-card-link flex h-full flex-col p-5 sm:p-6"
              >
                <h2 className="text-lg sm:text-xl font-semibold text-fg-primary">{move.title}</h2>
                <p className="mt-2 text-sm sm:text-base text-fg-secondary flex-1">{move.body}</p>
                <span className="mt-4 text-sm font-semibold text-fg-primary">{move.cta} →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
