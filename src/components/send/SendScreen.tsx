'use client';

/**
 * SendScreen — the outbound half of money on OrangeCat (/send).
 *
 * Two entry points, matching the two ways you actually get asked for money:
 * a person (username or Lightning address) or an invoice someone handed you.
 *
 * The invoice path reads the amount locally and shows it BEFORE the confirm
 * button appears. Nobody should tap "send" on a figure we never displayed, and
 * an invoice with no amount is refused outright rather than paid blind.
 */

import { useCallback, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MoneyTabs } from '@/components/money/MoneyTabs';
import { ContributionAmountInput } from '@/components/payment/ContributionAmountInput';
import { useRequireAuth } from '@/hooks/useAuth';
import { sendInvoice, sendToPerson, type SendOutcome } from '@/services/send/send-client';
import { parseBolt11 } from '@/lib/bitcoin/bolt11';
import { SEND_COPY, SEND_NOTE_MAX_LENGTH } from '@/config/send';
import { PAY_MAX_BTC, PAY_MIN_BTC } from '@/config/pay';
import { DEFAULT_TIP_BTC } from '@/config/tips';
import { ROUTES } from '@/config/routes';

type Tab = 'person' | 'invoice';

export function SendScreen() {
  const { isLoading: authLoading } = useRequireAuth();

  const [tab, setTab] = useState<Tab>('person');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(DEFAULT_TIP_BTC);
  const [memo, setMemo] = useState('');
  const [invoice, setInvoice] = useState('');

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<SendOutcome | null>(null);

  // Read locally so the payer sees the figure before committing to it.
  const parsedInvoice = useMemo(() => (invoice.trim() ? parseBolt11(invoice) : null), [invoice]);
  const invoiceAmount = parsedInvoice?.amountBtc ?? null;
  const invoiceIsPayable = parsedInvoice?.network === 'mainnet' && invoiceAmount !== null;

  const reset = useCallback(() => {
    setOutcome(null);
    setError(null);
    setInvoice('');
    setRecipient('');
    setMemo('');
  }, []);

  const handleSend = useCallback(async () => {
    setSending(true);
    setError(null);
    try {
      setOutcome(
        tab === 'invoice'
          ? await sendInvoice(invoice)
          : await sendToPerson(recipient, amount, memo || undefined)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The payment did not go through.');
    } finally {
      setSending(false);
    }
  }, [tab, invoice, recipient, amount, memo]);

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-fg-tertiary" />
      </div>
    );
  }

  if (outcome) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
        <CheckCircle2 className="h-16 w-16 text-status-positive" />
        <p className="text-xl font-semibold text-fg-primary">{SEND_COPY.sentTitle}</p>
        <p className="text-sm text-fg-secondary">{SEND_COPY.sentBody(outcome.destination)}</p>
        <Button variant="accent" className="mt-2" onClick={reset}>
          {SEND_COPY.again}
        </Button>
      </div>
    );
  }

  const canSend =
    tab === 'invoice' ? invoiceIsPayable : recipient.trim().length > 0 && amount > 0;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-fg-primary">
        <ArrowUpRight className="h-6 w-6 text-fg-secondary" />
        {SEND_COPY.title}
      </h1>
      <p className="mt-1 text-sm text-fg-secondary">{SEND_COPY.subtitle}</p>

      <MoneyTabs className="mt-5" />

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-surface-raised p-1">
        {(['person', 'invoice'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setError(null);
            }}
            className={`min-h-11 rounded-md px-3 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-surface-base text-fg-primary shadow-sm'
                : 'text-fg-secondary hover:text-fg-primary'
            }`}
          >
            {t === 'person' ? SEND_COPY.personTab : SEND_COPY.invoiceTab}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {tab === 'person' ? (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-fg-secondary">
                {SEND_COPY.recipientLabel}
              </span>
              <input
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder={SEND_COPY.recipientPlaceholder}
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
                {SEND_COPY.memoLabel}
              </span>
              <input
                value={memo}
                onChange={e => setMemo(e.target.value.slice(0, SEND_NOTE_MAX_LENGTH))}
                placeholder={SEND_COPY.memoPlaceholder}
                className="min-h-11 w-full rounded-md border border-default bg-surface-base px-3 text-fg-primary placeholder:text-fg-tertiary focus:border-interactive focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </>
        ) : (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-fg-secondary">
                {SEND_COPY.invoiceLabel}
              </span>
              <textarea
                value={invoice}
                onChange={e => setInvoice(e.target.value)}
                placeholder={SEND_COPY.invoicePlaceholder}
                rows={4}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full resize-none rounded-md border border-default bg-surface-base p-3 font-mono text-xs text-fg-primary placeholder:text-fg-tertiary focus:border-interactive focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            {invoice.trim() && (
              <p
                className={`rounded-md border px-3 py-2 text-sm ${
                  invoiceIsPayable
                    ? 'border-subtle bg-surface-raised/40 text-fg-primary'
                    : 'border-status-warning/40 bg-status-warning-subtle text-fg-secondary'
                }`}
              >
                {invoiceIsPayable
                  ? SEND_COPY.invoiceReads(`${invoiceAmount} BTC`)
                  : parsedInvoice && parsedInvoice.network !== 'mainnet'
                    ? `That is a ${parsedInvoice.network} invoice, not a real-Bitcoin one.`
                    : SEND_COPY.invoiceUnreadable}
              </p>
            )}
          </>
        )}

        {error && <p className="text-sm text-status-negative">{error}</p>}
        <p className="text-center text-xs text-fg-tertiary">{SEND_COPY.disclaimer}</p>

        <Button
          variant="accent"
          className="w-full"
          onClick={handleSend}
          disabled={!canSend || sending}
          isLoading={sending}
        >
          {sending ? SEND_COPY.sending : SEND_COPY.confirm}
        </Button>

        <p className="text-center text-xs text-fg-tertiary">
          <Wallet className="mr-1 inline h-3 w-3" />
          <a href={ROUTES.DASHBOARD.WALLETS} className="underline hover:text-fg-secondary">
            {SEND_COPY.noWalletCta}
          </a>
        </p>
      </div>
    </div>
  );
}
