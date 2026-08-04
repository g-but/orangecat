'use client';

/**
 * RequestsScreen — asking a specific person for money, and seeing what's open.
 *
 * The third face of the money surface. Unlike a pay link (which anyone can use)
 * a request is addressed: the other person is notified and can pay in one tap
 * or decline. Nothing is charged — the copy says so, because an "ask" that
 * looked like a charge would be the fastest way to lose someone's trust.
 */

import { useCallback, useEffect, useState } from 'react';
import { HandCoins, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MoneyTabs } from '@/components/money/MoneyTabs';
import { ContributionAmountInput } from '@/components/payment/ContributionAmountInput';
import { useRequireAuth } from '@/hooks/useAuth';
import {
  createRequest,
  closeRequest,
  fetchPaymentRequests,
  type PaymentRequestRow,
} from '@/services/payment-requests/request-client';
import { REQUEST_COPY, REQUEST_NOTE_MAX_LENGTH } from '@/config/payment-requests';
import { PAY_MAX_BTC, PAY_MIN_BTC } from '@/config/pay';
import { DEFAULT_TIP_BTC } from '@/config/tips';

const STATUS_STYLES: Record<PaymentRequestRow['status'], string> = {
  pending: 'text-fg-secondary',
  paid: 'text-status-positive',
  declined: 'text-fg-tertiary',
  cancelled: 'text-fg-tertiary',
};

export function RequestsScreen() {
  const { user, isLoading: authLoading } = useRequireAuth();

  const [loading, setLoading] = useState(true);
  const [incoming, setIncoming] = useState<PaymentRequestRow[]>([]);
  const [outgoing, setOutgoing] = useState<PaymentRequestRow[]>([]);

  const [payer, setPayer] = useState('');
  const [amount, setAmount] = useState(DEFAULT_TIP_BTC);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchPaymentRequests()
      .then(({ incoming: i, outgoing: o }) => {
        setIncoming(i);
        setOutgoing(o);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.id) {
      load();
    }
  }, [user?.id, load]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createRequest(payer, amount, note || undefined);
      setSentTo(payer.replace(/^@/, ''));
      setPayer('');
      setNote('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create that request.');
    } finally {
      setSubmitting(false);
    }
  }, [payer, amount, note, load]);

  const handleClose = useCallback(
    async (id: string, status: 'cancelled' | 'declined') => {
      try {
        await closeRequest(id, status);
        load();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not update that request.');
      }
    },
    [load]
  );

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-fg-tertiary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-fg-primary">
        <HandCoins className="h-6 w-6 text-fg-secondary" />
        {REQUEST_COPY.title}
      </h1>
      <p className="mt-1 text-sm text-fg-secondary">{REQUEST_COPY.subtitle}</p>

      <MoneyTabs className="mt-5" />

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-fg-secondary">
            {REQUEST_COPY.payerLabel}
          </span>
          <input
            value={payer}
            onChange={e => setPayer(e.target.value)}
            placeholder={REQUEST_COPY.payerPlaceholder}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-11 w-full rounded-md border border-default bg-surface-base px-3 text-fg-primary placeholder:text-fg-tertiary focus:border-interactive focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <ContributionAmountInput
          value={amount}
          onChange={setAmount}
          minBtc={PAY_MIN_BTC}
          maxBtc={PAY_MAX_BTC}
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-fg-secondary">
            {REQUEST_COPY.noteLabel}
          </span>
          <input
            value={note}
            onChange={e => setNote(e.target.value.slice(0, REQUEST_NOTE_MAX_LENGTH))}
            placeholder={REQUEST_COPY.notePlaceholder}
            className="min-h-11 w-full rounded-md border border-default bg-surface-base px-3 text-fg-primary placeholder:text-fg-tertiary focus:border-interactive focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        {error && <p className="text-sm text-status-negative">{error}</p>}
        {sentTo && (
          <p className="rounded-md border border-subtle bg-surface-raised/40 px-3 py-2 text-sm text-fg-secondary">
            {REQUEST_COPY.sentBody(`@${sentTo}`)}
          </p>
        )}
        <p className="text-center text-xs text-fg-tertiary">{REQUEST_COPY.disclaimer}</p>

        <Button
          variant="accent"
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting || !payer.trim() || amount <= 0}
          isLoading={submitting}
        >
          {submitting ? REQUEST_COPY.submitting : REQUEST_COPY.submit}
        </Button>
      </div>

      <RequestList
        title={REQUEST_COPY.incomingTitle}
        rows={incoming}
        actionLabel={REQUEST_COPY.decline}
        onAction={id => handleClose(id, 'declined')}
      />
      <RequestList
        title={REQUEST_COPY.outgoingTitle}
        rows={outgoing}
        actionLabel={REQUEST_COPY.cancel}
        onAction={id => handleClose(id, 'cancelled')}
      />
    </div>
  );
}

function RequestList({
  title,
  rows,
  actionLabel,
  onAction,
}: {
  title: string;
  rows: PaymentRequestRow[];
  actionLabel: string;
  onAction: (id: string) => void;
}) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-caps text-fg-tertiary">
        {title}
      </h2>
      <ul className="divide-y divide-subtle rounded-lg border border-subtle">
        {rows.map(row => (
          <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-3">
            <div className="min-w-0">
              <p className="font-medium text-fg-primary">{row.amount_btc} BTC</p>
              {row.note && <p className="truncate text-sm text-fg-secondary">{row.note}</p>}
              <p className={`text-xs ${STATUS_STYLES[row.status]}`}>
                {REQUEST_COPY.statusLabels[row.status]}
              </p>
            </div>
            {row.status === 'pending' && (
              <Button variant="outline" size="sm" onClick={() => onAction(row.id)}>
                {actionLabel}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
