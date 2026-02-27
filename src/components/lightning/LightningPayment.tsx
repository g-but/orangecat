'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { toast } from 'sonner';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useNostr } from '@/hooks/useNostr';
import { NWCClient } from '@/lib/nostr/nwc';
import type { PaymentStatus } from '@/services/bitcoin/types';
import { LightningInvoiceForm } from './LightningInvoiceForm';
import { LightningInvoiceDisplay } from './LightningInvoiceDisplay';
import { LightningPaymentSuccess } from './LightningPaymentSuccess';

interface LightningPaymentProps {
  recipientAddress: string;
  projectTitle: string;
  projectId: string;
  presetAmount?: number; // in satoshis
  onPaymentComplete?: (paymentHash: string) => void;
  onPaymentFailed?: (error: string) => void;
  className?: string;
}

export interface Invoice {
  bolt11: string;
  paymentHash: string;
  expiresAt: Date;
  amount: number; // satoshis
  description: string;
}

export default function LightningPayment({
  recipientAddress: _recipientAddress,
  projectTitle,
  projectId: _projectId,
  presetAmount,
  onPaymentComplete,
  onPaymentFailed,
  className = '',
}: LightningPaymentProps) {
  const { displayCurrency } = useDisplayCurrency();
  const { nwcConnected, getNWCUri } = useNostr();

  const [amount, setAmount] = useState(presetAmount?.toString() || '');
  const [message, setMessage] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | 'checking'>('pending');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Timer for invoice expiry
  useEffect(() => {
    if (!invoice) {
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const timeRemaining = invoice.expiresAt.getTime() - now.getTime();

      if (timeRemaining <= 0) {
        setPaymentStatus('expired');
        setTimeLeft(0);
        return;
      }

      setTimeLeft(Math.floor(timeRemaining / 1000));
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [invoice]);

  // Cleanup poll on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  /** Poll for payment status via NWC lookup */
  const startPaymentPolling = useCallback(
    (paymentHash: string) => {
      const nwcUri = getNWCUri();
      if (!nwcUri) {
        return;
      }

      const client = new NWCClient(nwcUri);

      const interval = setInterval(async () => {
        try {
          const result = await client.lookupInvoice(paymentHash);
          if (result.settled_at) {
            setPaymentStatus('paid');
            clearInterval(interval);
            client.disconnect();
            onPaymentComplete?.(paymentHash);
            toast.success('Payment received!');
          }
        } catch {
          // Silently retry - polling is best-effort
        }
      }, 3000); // Check every 3 seconds

      setPollInterval(interval);

      // Stop polling after invoice expiry
      setTimeout(
        () => {
          clearInterval(interval);
          client.disconnect();
        },
        60 * 60 * 1000
      ); // Max 1 hour
    },
    [getNWCUri, onPaymentComplete]
  );

  /** Generate invoice via NWC */
  const generateNWCInvoice = async () => {
    const nwcUri = getNWCUri();
    if (!nwcUri) {
      return;
    }

    const amountSats = parseInt(amount);
    const description = `${projectTitle} - ${message || 'Lightning payment'}`;

    const client = new NWCClient(nwcUri);

    try {
      await client.connect();
      const nwcInvoice = await client.makeInvoice(amountSats, description, 3600);

      const inv: Invoice = {
        bolt11: nwcInvoice.invoice,
        paymentHash: nwcInvoice.payment_hash,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        amount: amountSats,
        description,
      };

      setInvoice(inv);
      setPaymentStatus('pending');
      toast.success('Lightning invoice created!');

      // Start polling for payment
      startPaymentPolling(nwcInvoice.payment_hash);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create invoice';
      toast.error(msg);
      onPaymentFailed?.(msg);
    } finally {
      client.disconnect();
    }
  };

  /** Generate demo invoice (no NWC) */
  const generateDemoInvoice = async () => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const amountSats = parseInt(amount);
    const description = `${projectTitle} - ${message || 'Lightning payment'}`;

    const demoInvoice: Invoice = {
      bolt11: `lnbc${amountSats}u1p${Math.random().toString(36).substring(2, 60)}`,
      paymentHash: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      amount: amountSats,
      description,
    };

    setInvoice(demoInvoice);
    setPaymentStatus('pending');
    toast.info('Demo invoice generated (connect NWC for real payments)');
  };

  const generateInvoice = async () => {
    if (!amount || parseInt(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsGenerating(true);

    try {
      if (nwcConnected) {
        await generateNWCInvoice();
      } else {
        await generateDemoInvoice();
      }
    } catch {
      toast.error('Failed to generate invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyInvoice = async () => {
    if (!invoice) {
      return;
    }

    try {
      await navigator.clipboard.writeText(invoice.bolt11);
      setCopied(true);
      toast.success('Invoice copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const resetPayment = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    setInvoice(null);
    setPaymentStatus('pending');
    setTimeLeft(null);
    setPollInterval(null);
  };

  // Payment success state
  if (paymentStatus === 'paid') {
    return (
      <LightningPaymentSuccess
        projectTitle={projectTitle}
        amountSats={invoice!.amount}
        onReset={resetPayment}
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-bitcoin-orange" />
          Lightning Payment
          {nwcConnected ? (
            <span className="ml-auto flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              <Wifi className="w-3 h-3" />
              NWC
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              <WifiOff className="w-3 h-3" />
              Demo
            </span>
          )}
        </CardTitle>

        {!nwcConnected && (
          <Alert className="mt-2 border-yellow-300 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              <strong>Demo Mode</strong> — Invoices are simulated.{' '}
              <a href="/settings" className="text-yellow-900 underline font-medium">
                Connect your wallet
              </a>{' '}
              via NWC to make real Lightning payments.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!invoice ? (
          <LightningInvoiceForm
            amount={amount}
            setAmount={setAmount}
            message={message}
            setMessage={setMessage}
            displayCurrency={displayCurrency}
            isGenerating={isGenerating}
            onGenerate={generateInvoice}
          />
        ) : (
          <LightningInvoiceDisplay
            invoice={invoice}
            paymentStatus={paymentStatus}
            timeLeft={timeLeft}
            copied={copied}
            nwcConnected={nwcConnected}
            onCopy={copyInvoice}
            onReset={resetPayment}
          />
        )}
      </CardContent>
    </Card>
  );
}
