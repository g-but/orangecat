'use client';

/**
 * RequestsScreen — asking a specific person for money, and seeing what's open.
 *
 * The third face of the money surface. Unlike a pay link (which anyone can use)
 * a request is addressed: the other person is notified and can pay in one tap
 * or decline. Nothing is charged — the copy says so, because an "ask" that
 * looked like a charge would be the fastest way to lose someone's trust.
 *
 * Every row names the other person. An earlier version listed bare amounts and
 * statuses, which is unreadable: "0.0005 BTC · Pending" gives you nothing to
 * decide with. And an incoming request now carries the Pay button itself, so
 * the answer to "someone asked me for money" doesn't depend on still having
 * their notification.
 */

import { useCallback, useEffect, useState } from 'react';
import { HandCoins, Inbox, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeading } from '@/components/layout/PageHeading';
import { MoneyTabs } from '@/components/money/MoneyTabs';
import { MoneyReceipt } from '@/components/money/MoneyReceipt';
import { ContributionAmountInput } from '@/components/payment/ContributionAmountInput';
import { useRequireAuth } from '@/hooks/useAuth';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import {
  createRequest,
  closeRequest,
  fetchPaymentRequests,
  type PaymentRequestRow,
} from '@/services/payment-requests/request-client';
import { REQUEST_COPY, REQUEST_NOTE_MAX_LENGTH } from '@/config/payment-requests';
import { PAY_MAX_BTC, PAY_MIN_BTC, buildPayUrl, payLinkOrigin } from '@/config/pay';
import { DEFAULT_TIP_BTC } from '@/config/tips';
import { haptic } from '@/lib/haptics';

const STATUS_STYLES: Record<PaymentRequestRow['status'], string> = {
  pending: 'text-fg-secondary',
  paid: 'text-status-positive',
  declined: 'text-fg-tertiary',
  cancelled: 'text-fg-tertiary',
};

interface SentRequest {
  name: string;
  amountBtc: number;
  note: string | null;
}

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
  const [sent, setSent] = useState<SentRequest | null>(null);

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
      const request = await createRequest(payer, amount, note || undefined);
      setSent({
        name: request.counterparty_name ?? `@${payer.replace(/^@/, '')}`,
        amountBtc: amount,
        note: note || null,
      });
      setPayer('');
      setNote('');
      load();
    } catch (e) {
      haptic('error');
      setError(e instanceof Error ? e.message : 'Could not create that request.');
    } finally {
      setSubmitting(false);
    }
  }, [payer, amount, note, load]);

  const handleClose = useCallback(
    async (id: string, status: 'cancelled' | 'declined') => {
      // Optimistic: the row reflects the decision immediately, because the user
      // just made it and a spinner on their own choice reads as hesitation.
      const revert = { incoming, outgoing };
      const settle = (rows: PaymentRequestRow[]) =>
        rows.map(r => (r.id === id ? { ...r, status } : r));
      setIncoming(settle(incoming));
      setOutgoing(settle(outgoing));

      try {
        await closeRequest(id, status);
        toast.success(status === 'declined' ? REQUEST_COPY.declined : REQUEST_COPY.cancelled);
      } catch (e) {
        setIncoming(revert.incoming);
        setOutgoing(revert.outgoing);
        haptic('error');
        toast.error(e instanceof Error ? e.message : 'Could not update that request.');
      }
    },
    [incoming, outgoing]
  );

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-fg-tertiary" />
      </div>
    );
  }

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-md px-4">
        <MoneyReceipt
          title={REQUEST_COPY.sent}
          amountBtc={sent.amountBtc}
          counterparty={sent.name}
          counterpartyLabel="From"
          note={sent.note}
          fallbackBody={REQUEST_COPY.sentBody(sent.name)}
        >
          <Button variant="outline" onClick={() => setSent(null)}>
            {REQUEST_COPY.submit}
          </Button>
        </MoneyReceipt>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <PageHeading className="flex items-center gap-2">
        <HandCoins className="h-6 w-6 shrink-0 text-fg-secondary" aria-hidden="true" />
        {REQUEST_COPY.title}
      </PageHeading>
      <p className="mt-1 text-sm text-fg-secondary">{REQUEST_COPY.subtitle}</p>

      <MoneyTabs className="mt-5" />

      <div className="mt-6 space-y-4">
        <Input
          label={REQUEST_COPY.payerLabel}
          value={payer}
          onChange={e => setPayer(e.target.value)}
          placeholder={REQUEST_COPY.payerPlaceholder}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-h-11"
        />

        <ContributionAmountInput
          value={amount}
          onChange={setAmount}
          minBtc={PAY_MIN_BTC}
          maxBtc={PAY_MAX_BTC}
        />

        <Input
          label={REQUEST_COPY.noteLabel}
          value={note}
          onChange={e => setNote(e.target.value.slice(0, REQUEST_NOTE_MAX_LENGTH))}
          placeholder={REQUEST_COPY.notePlaceholder}
          className="min-h-11"
        />

        {error && <p className="text-sm text-status-negative">{error}</p>}
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
        emptyText={REQUEST_COPY.incomingEmpty}
        emptyIcon={Inbox}
        rows={incoming}
        direction="incoming"
        onClose={id => handleClose(id, 'declined')}
      />
      <RequestList
        title={REQUEST_COPY.outgoingTitle}
        emptyText={REQUEST_COPY.outgoingEmpty}
        emptyIcon={Send}
        rows={outgoing}
        direction="outgoing"
        onClose={id => handleClose(id, 'cancelled')}
      />
    </div>
  );
}

function RequestList({
  title,
  emptyText,
  emptyIcon: EmptyIcon,
  rows,
  direction,
  onClose,
}: {
  title: string;
  emptyText: string;
  emptyIcon: typeof Inbox;
  rows: PaymentRequestRow[];
  direction: 'incoming' | 'outgoing';
  onClose: (id: string) => void;
}) {
  const { formatAmountBtc } = useDisplayCurrency();

  return (
    <section className="mt-8">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-caps text-fg-tertiary">
        {title}
      </h2>

      {rows.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg border border-subtle px-3 py-4 text-sm text-fg-tertiary">
          <EmptyIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {emptyText}
        </p>
      ) : (
        <ul className="divide-y divide-subtle rounded-lg border border-subtle">
          {rows.map(row => {
            const name = row.counterparty_name ?? REQUEST_COPY.unknownParty;
            return (
              <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-fg-primary">{formatAmountBtc(row.amount_btc)}</p>
                  <p className="truncate text-sm text-fg-secondary">
                    {direction === 'incoming' ? REQUEST_COPY.from(name) : REQUEST_COPY.to(name)}
                    {row.note ? ` · ${row.note}` : ''}
                  </p>
                  <p className={`text-xs ${STATUS_STYLES[row.status]}`}>
                    {REQUEST_COPY.statusLabels[row.status]}
                  </p>
                </div>

                {row.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    {/* The ask is a suggestion: the pay page opens prefilled and
                        stays editable, exactly like a shared pay link. */}
                    {direction === 'incoming' && row.counterparty_username && (
                      <Button
                        variant="accent"
                        size="sm"
                        href={buildPayUrl(payLinkOrigin(), row.counterparty_username, {
                          amountBtc: row.amount_btc,
                          note: row.note ?? undefined,
                        })}
                      >
                        {REQUEST_COPY.pay}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onClose(row.id)}>
                      {direction === 'incoming' ? REQUEST_COPY.decline : REQUEST_COPY.cancel}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
