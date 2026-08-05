'use client';

/**
 * PayFlow — the one implementation of "pay this person".
 *
 * Lifted out of TipDialog so the modal and the public /pay/<username> page run
 * the SAME flow: check the recipient can actually receive → pick an amount →
 * mint an invoice against their own wallet → watch it settle. A payment path
 * is the last thing that should exist twice, and a second copy would inevitably
 * drift on the parts that matter (bounds, polling, expiry handling).
 *
 * Non-custodial throughout: the invoice is minted from the recipient's wallet
 * and the funds never touch OrangeCat.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MoneyReceipt } from '@/components/money/MoneyReceipt';
import { PaymentQRCode } from '@/components/payment/PaymentQRCode';
import { AmountField } from '@/components/money/AmountField';
import {
  fetchTipInvoice,
  fetchTipReceiveInfo,
  fetchTipStatus,
  type TipInvoice,
} from '@/services/tips/tip-client';
import {
  DEFAULT_TIP_BTC,
  TIP_COPY,
  TIP_MAX_BTC,
  TIP_MIN_BTC,
  TIP_POLL_INTERVAL_MS,
} from '@/config/tips';

export type PayFlowState = 'pending' | 'paid' | 'expired';

interface PayFlowProps {
  username: string;
  recipientName: string;
  /** Re-runs the receive check when this flips true (modal open, page mount). */
  active?: boolean;
  /** Suggested amount from a pay link — the payer can still change it. */
  initialAmountBtc?: number;
  /** Rendered above the amount input; the "what is this for" from the link. */
  noteSlot?: React.ReactNode;
  /** Extra content under the amount input (e.g. a link-prefill warning). */
  beforeActionSlot?: React.ReactNode;
  /** Shown alongside the confirmation — lets a modal offer "Done". */
  renderDone?: (reset: () => void) => React.ReactNode;
}

export function PayFlow({
  username,
  recipientName,
  active = true,
  initialAmountBtc,
  noteSlot,
  beforeActionSlot,
  renderDone,
}: PayFlowProps) {
  const [amount, setAmount] = useState(initialAmountBtc ?? DEFAULT_TIP_BTC);
  const [checkingWallet, setCheckingWallet] = useState(true);
  const [canReceive, setCanReceive] = useState<boolean | null>(null);
  const [invoice, setInvoice] = useState<TipInvoice | null>(null);
  const [settleState, setSettleState] = useState<PayFlowState>('pending');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }
    let live = true;
    setInvoice(null);
    setSettleState('pending');
    setError(null);
    setAmount(initialAmountBtc ?? DEFAULT_TIP_BTC);
    setCheckingWallet(true);
    setCanReceive(null);
    fetchTipReceiveInfo(username)
      .then(info => live && setCanReceive(info.canReceive))
      .catch(() => live && setCanReceive(false))
      .finally(() => live && setCheckingWallet(false));
    return () => {
      live = false;
    };
  }, [active, username, initialAmountBtc]);

  // Poll while an unpaid invoice is on screen — Lightning settles in seconds,
  // so the payer should see confirmation without refreshing anything.
  const invoiceRef = useRef(invoice);
  invoiceRef.current = invoice;
  useEffect(() => {
    if (!invoice || settleState !== 'pending') {
      return;
    }
    let live = true;
    const id = setInterval(async () => {
      const current = invoiceRef.current;
      if (!current) {
        return;
      }
      try {
        const { status } = await fetchTipStatus(current.intentId, current.statusToken);
        if (!live) {
          return;
        }
        if (status === 'paid') {
          setSettleState('paid');
        } else if (status === 'expired' || status === 'failed') {
          setSettleState('expired');
        }
      } catch {
        // Transient — keep polling; the interval clears on settle or unmount.
      }
    }, TIP_POLL_INTERVAL_MS);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [invoice, settleState]);

  const reset = useCallback(() => {
    setInvoice(null);
    setSettleState('pending');
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      setInvoice(await fetchTipInvoice(username, amount));
      setSettleState('pending');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create a payment request.');
    } finally {
      setGenerating(false);
    }
  }, [username, amount]);

  if (checkingWallet) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-fg-tertiary" />
      </div>
    );
  }

  if (canReceive === false) {
    return (
      <p className="rounded-md border border-subtle bg-surface-raised/40 px-4 py-6 text-center text-sm text-fg-secondary">
        {TIP_COPY.noWallet(recipientName)}
      </p>
    );
  }

  if (invoice && settleState === 'paid') {
    return (
      <MoneyReceipt
        title={TIP_COPY.paidTitle}
        amountBtc={invoice.amountBtc}
        counterparty={recipientName}
        fallbackBody={TIP_COPY.paidBody(recipientName)}
      >
        {renderDone?.(reset)}
      </MoneyReceipt>
    );
  }

  if (invoice && settleState === 'expired') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Clock className="h-12 w-12 text-fg-tertiary" />
        <p className="text-lg font-semibold text-fg-primary">{TIP_COPY.expiredTitle}</p>
        <p className="text-sm text-fg-secondary">{TIP_COPY.expiredBody}</p>
        <Button variant="outline" className="mt-2" onClick={reset}>
          {TIP_COPY.again}
        </Button>
      </div>
    );
  }

  if (invoice) {
    return (
      <div className="space-y-4">
        <PaymentQRCode
          qrData={invoice.qrData}
          methodLabel={invoice.methodLabel}
          amountBtc={invoice.amountBtc}
          expiresInSeconds={invoice.expiresInSeconds ?? undefined}
        />
        <p className="flex items-center justify-center gap-2 text-center text-sm text-fg-secondary">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {TIP_COPY.scan}
        </p>
        <p className="text-center text-xs text-fg-tertiary">{TIP_COPY.disclaimer}</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={reset}>
            {TIP_COPY.again}
          </Button>
          {renderDone?.(reset)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {noteSlot}
      <AmountField
        value={amount}
        onChange={setAmount}
        minBtc={TIP_MIN_BTC}
        maxBtc={TIP_MAX_BTC}
      />
      {beforeActionSlot}
      {error && <p className="text-sm text-status-negative">{error}</p>}
      <p className="text-center text-xs text-fg-tertiary">{TIP_COPY.disclaimer}</p>
      <Button
        variant="accent"
        className="w-full"
        onClick={handleGenerate}
        disabled={generating || amount <= 0}
        isLoading={generating}
      >
        {generating ? TIP_COPY.generating : TIP_COPY.generate}
      </Button>
    </div>
  );
}
