/**
 * `orangecat.ch/pay/<username>` — the link you send someone so they can pay you.
 *
 * Public and account-free by design: the payer needs a Bitcoin wallet, not an
 * OrangeCat login. It is alias-backed rather than invoice-backed, so the page
 * mints a fresh invoice when the payer arrives — which is the only way a link
 * survives sitting in a chat thread overnight.
 *
 * The page renders even when the recipient currently cannot receive; it says so
 * plainly instead of 404-ing, because a payment link that dies silently is worse
 * than one that explains itself.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getAdminClient } from '@/lib/supabase/admin';
import { DATABASE_TABLES } from '@/config/database-tables';
import { APP_NAME, SITE_URL } from '@/config/brand';
import { PAY_COPY } from '@/config/pay';
import { getTipReceiveInfo } from '@/domain/tips/tip-service';
import { PayPageClient } from './PayPageClient';

interface PageProps {
  params: Promise<{ username: string }>;
}

interface PayRecipient {
  username: string;
  displayName: string;
}

// cache() dedupes the lookup across generateMetadata and the page body, which
// both need the recipient — otherwise every pay link costs two profile queries.
const getRecipient = cache(async (username: string): Promise<PayRecipient | null> => {
  const { data } = await getAdminClient()
    .from(DATABASE_TABLES.PROFILES)
    .select('username, display_name:name')
    .ilike('username', username)
    .maybeSingle();

  const row = data as { username?: string | null; display_name?: string | null } | null;
  if (!row?.username) {
    return null;
  }
  return { username: row.username, displayName: row.display_name || row.username };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const recipient = await getRecipient(username);
  if (!recipient) {
    // generateMetadata resolves before the page's streaming boundary, so
    // notFound() here sends a real 404 — the same call inside the streamed page
    // body gets forced to a 200 "soft 404" by the root loading.tsx. A payment
    // link to a mistyped name should fail honestly.
    notFound();
  }
  const title = `${PAY_COPY.title(recipient.displayName)} — ${APP_NAME}`;
  return {
    title,
    description: PAY_COPY.subtitle,
    alternates: { canonical: `${SITE_URL}/pay/${recipient.username}` },
    openGraph: { title, description: PAY_COPY.subtitle, type: 'website' },
    // A personal payment page is for the person holding the link, not for search.
    robots: { index: false, follow: false },
  };
}

export default async function PayPage({ params }: PageProps) {
  const { username } = await params;
  const recipient = await getRecipient(username);
  if (!recipient) {
    notFound();
  }

  // Resolve "can this person receive?" here rather than from the browser. It is
  // the one thing standing between arriving and being able to type an amount,
  // and asking for it client-side meant a pay link opened on a spinner — on the
  // one surface whose entire job is to be handed to someone else.
  const receiveInfo = await getTipReceiveInfo(getAdminClient(), recipient.username);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-fg-primary">
          {PAY_COPY.title(recipient.displayName)}
        </h1>
        <p className="mt-1 text-sm text-fg-secondary">{PAY_COPY.subtitle}</p>
        <p className="mt-1 font-mono text-xs text-fg-tertiary">@{recipient.username}</p>
      </header>

      <Suspense
        fallback={
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-fg-tertiary" />
          </div>
        }
      >
        <PayPageClient
          username={recipient.username}
          recipientName={recipient.displayName}
          canReceive={!!receiveInfo?.canReceive}
        />
      </Suspense>
    </div>
  );
}
