'use client';

/**
 * SendScreen — the outbound half of money on OrangeCat (/send).
 *
 * Two entry points, matching the two ways you actually get asked for money:
 * a person (username or Lightning address) or an invoice someone handed you.
 *
 * Both paths obey the same rule: nothing is spent until the payer has been
 * shown, in words, exactly what is about to happen.
 *  - The person path resolves the recipient while you type and then puts a
 *    review step in front of the send, because you typed both the name and the
 *    amount and either could be wrong.
 *  - The invoice path reads the amount locally and shows it before the confirm
 *    button appears. It needs no review step — you typed nothing to get it
 *    wrong, and an extra tap confirming a single fact already on screen is
 *    ceremony, not safety. An invoice with no amount is refused outright rather
 *    than paid blind.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { PageHeading } from '@/components/layout/PageHeading';
import { MoneyTabs } from '@/components/money/MoneyTabs';
import { MoneyReceipt } from '@/components/money/MoneyReceipt';
import { StatusNote } from '@/components/money/StatusNote';
import { AmountField } from '@/components/money/AmountField';
import { MoneyActionBar } from '@/components/money/MoneyActionBar';
import { RecipientStatus } from '@/components/send/RecipientStatus';
import { SendReviewStep } from '@/components/send/SendReviewStep';
import { useRecipientCheck } from '@/components/send/useRecipientCheck';
import { useRequireAuth } from '@/hooks/useAuth';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import {
  sendInvoice,
  sendToPerson,
  fetchSendCapability,
  type SendOutcome,
  type SendCapability,
} from '@/services/send/send-client';
import { parseBolt11 } from '@/lib/bitcoin/bolt11';
import { haptic } from '@/lib/haptics';
import { SEND_COPY, SEND_NOTE_MAX_LENGTH } from '@/config/send';
import { PAY_MAX_BTC, PAY_MIN_BTC } from '@/config/pay';
import { DEFAULT_TIP_BTC } from '@/config/tips';
import { ROUTES } from '@/config/routes';

type Tab = 'person' | 'invoice';

const TABS = [
  { value: 'person' as const, label: SEND_COPY.personTab },
  { value: 'invoice' as const, label: SEND_COPY.invoiceTab },
];

export function SendScreen() {
  const { isLoading: authLoading } = useRequireAuth();
  const { formatAmountBtc } = useDisplayCurrency();

  const [tab, setTab] = useState<Tab>('person');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(DEFAULT_TIP_BTC);
  const [memo, setMemo] = useState('');
  const [invoice, setInvoice] = useState('');

  const [capability, setCapability] = useState<SendCapability | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<SendOutcome | null>(null);

  // Asked once, before the form is offered — see fetchSendCapability.
  useEffect(() => {
    let active = true;
    void fetchSendCapability().then(c => {
      if (active) {
        setCapability(c);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const recipientCheck = useRecipientCheck(tab === 'person' ? recipient : '');

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
    setReviewing(false);
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
      haptic('error');
      setReviewing(false);
      setError(e instanceof Error ? e.message : 'The payment did not go through.');
    } finally {
      setSending(false);
    }
  }, [tab, invoice, recipient, amount, memo]);

  if (authLoading || !capability) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-fg-tertiary" />
      </div>
    );
  }

  // Nothing on this screen can work without a wallet to spend from, so say so
  // instead of rendering a form that ends in a refusal.
  if (!capability.canSend) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <Wallet className="h-12 w-12 text-fg-tertiary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-fg-primary">{SEND_COPY.noWalletTitle}</h2>
        <p className="text-sm text-fg-secondary">{capability.message ?? SEND_COPY.noWalletBody}</p>
        <Button variant="accent" href={ROUTES.DASHBOARD.WALLETS}>
          {SEND_COPY.noWalletCta}
        </Button>
        <MoneyTabs className="mt-4 w-full" />
      </div>
    );
  }

  if (outcome) {
    return (
      <div className="mx-auto w-full max-w-md px-4">
        <MoneyReceipt
          title={SEND_COPY.sentTitle}
          amountBtc={outcome.amountBtc}
          counterparty={outcome.destination === 'invoice' ? null : outcome.destination}
          counterpartyLabel={SEND_COPY.reviewTo}
          note={memo || null}
          fallbackBody={SEND_COPY.sentFallback}
        >
          <Button variant="accent" onClick={reset}>
            {SEND_COPY.again}
          </Button>
        </MoneyReceipt>
      </div>
    );
  }

  const canReview =
    tab === 'invoice' ? invoiceIsPayable : recipientCheck.payable && amount > 0;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <PageHeading className="flex items-center gap-2">
        <ArrowUpRight className="h-6 w-6 shrink-0 text-fg-secondary" aria-hidden="true" />
        {SEND_COPY.title}
      </PageHeading>
      <p className="mt-1 text-sm text-fg-secondary">{SEND_COPY.subtitle}</p>

      <MoneyTabs className="mt-5" />

      {reviewing ? (
        <SendReviewStep
          recipientName={recipientCheck.name ?? recipient}
          amountLabel={formatAmountBtc(amount)}
          note={memo}
          sending={sending}
          onBack={() => setReviewing(false)}
          onConfirm={handleSend}
          error={error}
        />
      ) : (
        <>
          <SegmentedControl
            className="mt-3"
            label="Send method"
            items={TABS}
            value={tab}
            onChange={value => {
              setTab(value);
              setError(null);
            }}
          />

          <div className="mt-6 space-y-4">
            {tab === 'person' ? (
              <>
                <Input
                  label={SEND_COPY.recipientLabel}
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder={SEND_COPY.recipientPlaceholder}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-h-11"
                />

                <RecipientStatus check={recipientCheck} handle={recipient} />

                <AmountField
                  value={amount}
                  onChange={setAmount}
                  minBtc={PAY_MIN_BTC}
                  maxBtc={PAY_MAX_BTC}
                />

                <Input
                  label={SEND_COPY.memoLabel}
                  value={memo}
                  onChange={e => setMemo(e.target.value.slice(0, SEND_NOTE_MAX_LENGTH))}
                  placeholder={SEND_COPY.memoPlaceholder}
                  className="min-h-11"
                />
              </>
            ) : (
              <>
                <Textarea
                  label={SEND_COPY.invoiceLabel}
                  value={invoice}
                  onChange={e => setInvoice(e.target.value)}
                  placeholder={SEND_COPY.invoicePlaceholder}
                  rows={4}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="resize-none font-mono text-xs"
                />

                {invoice.trim() && (
                  <StatusNote tone={invoiceIsPayable ? 'neutral' : 'warning'}>
                    {invoiceIsPayable
                      ? SEND_COPY.invoiceReads(formatAmountBtc(invoiceAmount as number))
                      : parsedInvoice && parsedInvoice.network !== 'mainnet'
                        ? SEND_COPY.invoiceWrongNetwork(parsedInvoice.network)
                        : SEND_COPY.invoiceUnreadable}
                  </StatusNote>
                )}
              </>
            )}

            {error && <p className="text-sm text-status-negative">{error}</p>}
            <p className="text-center text-xs text-fg-tertiary">{SEND_COPY.disclaimer}</p>

            <MoneyActionBar>
              <Button
                variant="accent"
                className="w-full"
                onClick={() => (tab === 'invoice' ? void handleSend() : setReviewing(true))}
                disabled={!canReview || sending}
                isLoading={sending}
              >
                {sending
                  ? SEND_COPY.sending
                  : tab === 'invoice'
                    ? SEND_COPY.confirm
                    : SEND_COPY.review}
              </Button>
            </MoneyActionBar>
          </div>
        </>
      )}
    </div>
  );
}
