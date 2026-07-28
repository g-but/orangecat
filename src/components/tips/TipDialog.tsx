'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Zap, CheckCircle2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { PaymentQRCode } from '@/components/payment/PaymentQRCode';
import { ContributionAmountInput } from '@/components/payment/ContributionAmountInput';
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

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  recipientName: string;
}

type SettleState = 'pending' | 'paid' | 'expired';

export default function TipDialog({ open, onOpenChange, username, recipientName }: TipDialogProps) {
  const [amount, setAmount] = useState(DEFAULT_TIP_BTC);
  const [checkingWallet, setCheckingWallet] = useState(true);
  const [canReceive, setCanReceive] = useState<boolean | null>(null);
  const [invoice, setInvoice] = useState<TipInvoice | null>(null);
  const [settleState, setSettleState] = useState<SettleState>('pending');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On open, reset and check whether the recipient can receive tips.
  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    setInvoice(null);
    setSettleState('pending');
    setError(null);
    setAmount(DEFAULT_TIP_BTC);
    setCheckingWallet(true);
    setCanReceive(null);
    fetchTipReceiveInfo(username)
      .then(info => {
        if (active) {
          setCanReceive(info.canReceive);
        }
      })
      .catch(() => {
        if (active) {
          setCanReceive(false);
        }
      })
      .finally(() => {
        if (active) {
          setCheckingWallet(false);
        }
      });
    return () => {
      active = false;
    };
  }, [open, username]);

  // While an unpaid invoice is showing, poll for settlement. Any Lightning wallet
  // pays near-instantly, so the tipper sees "received!" without leaving the modal.
  const invoiceRef = useRef(invoice);
  invoiceRef.current = invoice;
  useEffect(() => {
    if (!invoice || settleState !== 'pending') {
      return;
    }
    let active = true;
    const id = setInterval(async () => {
      const current = invoiceRef.current;
      if (!current) {
        return;
      }
      try {
        const { status } = await fetchTipStatus(current.intentId, current.statusToken);
        if (!active) {
          return;
        }
        if (status === 'paid') {
          setSettleState('paid');
        } else if (status === 'expired' || status === 'failed') {
          setSettleState('expired');
        }
      } catch {
        // Transient — keep polling; the interval clears on close/settle.
      }
    }, TIP_POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [invoice, settleState]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      setInvoice(await fetchTipInvoice(username, amount));
      setSettleState('pending');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create a tip request.');
    } finally {
      setGenerating(false);
    }
  }

  function resetToAmount() {
    setInvoice(null);
    setSettleState('pending');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-bitcoinOrange" />
            {TIP_COPY.title(recipientName)}
          </DialogTitle>
          <DialogDescription>{TIP_COPY.subtitle}</DialogDescription>
        </DialogHeader>

        {checkingWallet ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-fg-tertiary" />
          </div>
        ) : canReceive === false ? (
          <p className="rounded-md border border-subtle bg-surface-raised/40 px-4 py-6 text-center text-sm text-fg-secondary">
            {TIP_COPY.noWallet(recipientName)}
          </p>
        ) : invoice && settleState === 'paid' ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-status-positive" />
            <p className="text-lg font-semibold text-fg-primary">{TIP_COPY.paidTitle}</p>
            <p className="text-sm text-fg-secondary">{TIP_COPY.paidBody(recipientName)}</p>
            <Button variant="accent" className="mt-2" onClick={() => onOpenChange(false)}>
              {TIP_COPY.done}
            </Button>
          </div>
        ) : invoice && settleState === 'expired' ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Clock className="h-12 w-12 text-fg-tertiary" />
            <p className="text-lg font-semibold text-fg-primary">{TIP_COPY.expiredTitle}</p>
            <p className="text-sm text-fg-secondary">{TIP_COPY.expiredBody}</p>
            <Button variant="outline" className="mt-2" onClick={resetToAmount}>
              {TIP_COPY.again}
            </Button>
          </div>
        ) : invoice ? (
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
              <Button variant="outline" onClick={resetToAmount}>
                {TIP_COPY.again}
              </Button>
              <Button variant="accent" onClick={() => onOpenChange(false)}>
                {TIP_COPY.done}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ContributionAmountInput
              value={amount}
              onChange={setAmount}
              minBtc={TIP_MIN_BTC}
              maxBtc={TIP_MAX_BTC}
            />
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
        )}
      </DialogContent>
    </Dialog>
  );
}
