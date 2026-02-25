'use client';

/**
 * Lightning Payment Component
 *
 * Generates Lightning invoices and displays QR codes for payment.
 * Supports two modes:
 * - NWC mode: Uses Nostr Wallet Connect for real invoice generation
 * - Demo mode: Generates mock invoices for preview (when no NWC connected)
 *
 * Created: 2025-01-08
 * Last Modified: 2026-02-25
 * Last Modified Summary: Integrated NWC for real Lightning invoice generation
 */

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Zap, Copy, Check, ExternalLink, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'sonner';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useNostr } from '@/hooks/useNostr';
import { NWCClient } from '@/lib/nostr/nwc';
import type { PaymentStatus } from '@/services/bitcoin/types';

interface LightningPaymentProps {
  recipientAddress: string;
  projectTitle: string;
  projectId: string;
  presetAmount?: number; // in satoshis
  onPaymentComplete?: (paymentHash: string) => void;
  onPaymentFailed?: (error: string) => void;
  className?: string;
}

interface Invoice {
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Payment success state
  if (paymentStatus === 'paid') {
    return (
      <Card className={`text-center ${className}`}>
        <CardContent className="p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Received!</h3>
          <p className="text-gray-600 mb-4">
            Thank you for supporting {projectTitle} with your Lightning payment.
          </p>
          <CurrencyDisplay
            amount={invoice!.amount}
            currency="SATS"
            className="text-lg font-semibold text-green-600"
          />
          <Button onClick={resetPayment} variant="outline" className="mt-4">
            Make Another Payment
          </Button>
        </CardContent>
      </Card>
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
          // Invoice Generation Form
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ({displayCurrency})
              </label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount in sats"
                min="1"
                className="font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (optional)
              </label>
              <Input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Add a message with your payment"
                maxLength={100}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Lightning Benefits</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>Instant payments (usually under 3 seconds)</li>
                    <li>Extremely low fees (typically &lt; 1 sat)</li>
                    <li>Perfect for small amounts and tips</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={generateInvoice} disabled={isGenerating || !amount} className="w-full">
              {isGenerating ? (
                'Generating...'
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Lightning Invoice
                </>
              )}
            </Button>
          </div>
        ) : (
          // Invoice Display
          <div className="space-y-4">
            {/* Payment Amount */}
            <div className="text-center">
              <CurrencyDisplay
                amount={invoice.amount}
                currency="SATS"
                className="text-xl font-semibold"
              />
              {invoice.description && (
                <p className="text-sm text-gray-600 mt-1">{invoice.description}</p>
              )}
            </div>

            {/* QR Code */}
            {paymentStatus !== 'expired' && (
              <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-lg">
                <QRCodeSVG
                  value={invoice.bolt11.toUpperCase()}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
            )}

            {/* Invoice String */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lightning Invoice
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <code className="text-xs text-gray-600 break-all font-mono">
                    {invoice.bolt11}
                  </code>
                </div>
                <Button
                  onClick={copyInvoice}
                  variant="outline"
                  size="sm"
                  className={copied ? 'bg-green-50 text-green-700 border-green-200' : ''}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => window.open(`lightning:${invoice.bolt11}`, '_blank')}
                className="flex-1"
                disabled={paymentStatus === 'expired'}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Wallet
              </Button>
            </div>

            {/* Reset Button */}
            {(paymentStatus === 'expired' || paymentStatus === 'failed') && (
              <Button onClick={resetPayment} variant="outline" className="w-full">
                Generate New Invoice
              </Button>
            )}

            {/* Timer */}
            {timeLeft !== null && timeLeft > 0 && (
              <div className="text-center text-sm text-gray-500">
                Invoice expires in {formatTime(timeLeft)}
              </div>
            )}

            {/* Payment polling indicator */}
            {paymentStatus === 'pending' && nwcConnected && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Waiting for payment...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
