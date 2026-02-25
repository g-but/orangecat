'use client';

/**
 * Nostr Connection Card
 *
 * Allows users to connect their Nostr identity and NWC wallet.
 * This is separate from social links - it enables:
 * - NIP-07 browser extension signing
 * - NWC wallet connection for Lightning payments
 * - Profile npub display
 *
 * Created: 2026-02-25
 */

import { useState, useEffect, useCallback } from 'react';
import { Zap, Key, Unplug, ExternalLink, Copy, Check, AlertCircle, Wallet } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { useNostr } from '@/hooks/useNostr';
import { NWCClient } from '@/lib/nostr/nwc';
import { shortenNpub, isValidNWCUri } from '@/lib/nostr';
import { logger } from '@/utils/logger';

export function NostrConnectionCard() {
  const {
    connected,
    npub,
    profile,
    nwcConnected,
    loading,
    error,
    hasExtension,
    connectWithExtension,
    connectWithNpub,
    disconnect,
    saveNWCUri,
    getNWCUri,
    removeNWC,
  } = useNostr();

  const [showNpubInput, setShowNpubInput] = useState(false);
  const [npubInput, setNpubInput] = useState('');
  const [showNwcInput, setShowNwcInput] = useState(false);
  const [nwcInput, setNwcInput] = useState('');
  const [nwcError, setNwcError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [balanceSats, setBalanceSats] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Fetch wallet balance when NWC is connected
  const fetchBalance = useCallback(async () => {
    const nwcUri = getNWCUri();
    if (!nwcUri || !nwcConnected) {
      return;
    }

    setBalanceLoading(true);
    const client = new NWCClient(nwcUri);
    try {
      await client.connect();
      const sats = await client.getBalance();
      setBalanceSats(sats);
    } catch (err) {
      logger.warn('Failed to fetch NWC balance', { error: err });
    } finally {
      client.disconnect();
      setBalanceLoading(false);
    }
  }, [getNWCUri, nwcConnected]);

  useEffect(() => {
    if (nwcConnected) {
      fetchBalance();
    } else {
      setBalanceSats(null);
    }
  }, [nwcConnected, fetchBalance]);

  const handleNpubConnect = () => {
    if (npubInput.trim()) {
      connectWithNpub(npubInput.trim());
      setShowNpubInput(false);
      setNpubInput('');
    }
  };

  const handleNwcConnect = () => {
    setNwcError(null);
    if (!isValidNWCUri(nwcInput.trim())) {
      setNwcError('Invalid NWC URI. It should start with nostr+walletconnect://');
      return;
    }
    saveNWCUri(nwcInput.trim());
    setShowNwcInput(false);
    setNwcInput('');
  };

  const handleCopyNpub = async () => {
    if (npub) {
      await navigator.clipboard.writeText(npub);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-purple-500" />
          Nostr
        </CardTitle>
        <CardDescription>
          Connect your Nostr identity for portable profiles and Lightning payments via NWC.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Connection Status */}
        {connected && npub ? (
          <div className="space-y-3">
            {/* Connected identity */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-3 min-w-0">
                {profile?.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.picture} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center">
                    <Key className="h-4 w-4 text-purple-600" />
                  </div>
                )}
                <div className="min-w-0">
                  {profile?.display_name || profile?.name ? (
                    <div className="text-sm font-medium truncate">
                      {profile.display_name || profile.name}
                    </div>
                  ) : null}
                  <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                    {shortenNpub(npub)}
                    <button
                      onClick={handleCopyNpub}
                      className="p-0.5 hover:text-foreground transition-colors"
                      title="Copy npub"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                className="text-muted-foreground"
              >
                <Unplug className="h-4 w-4" />
              </Button>
            </div>

            {/* NWC Wallet Connection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-bitcoin-orange" />
                  Wallet Connect (NWC)
                </span>
                {nwcConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-medium">Connected</span>
                    <Button variant="ghost" size="sm" onClick={removeNWC}>
                      <Unplug className="h-3 w-3" />
                    </Button>
                  </div>
                ) : null}
              </div>

              {nwcConnected ? (
                <div className="space-y-2">
                  {balanceSats !== null && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 border border-green-200">
                      <Wallet className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Balance:</span>
                      <CurrencyDisplay
                        amount={balanceSats}
                        currency="SATS"
                        className="text-sm font-semibold text-green-900"
                      />
                    </div>
                  )}
                  {balanceLoading && (
                    <p className="text-xs text-muted-foreground">Loading balance...</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Your wallet is connected via NWC. You can send and receive Lightning payments.
                  </p>
                </div>
              ) : showNwcInput ? (
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="nostr+walletconnect://..."
                    value={nwcInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNwcInput(e.target.value)
                    }
                    className="font-mono text-xs"
                  />
                  {nwcError && <p className="text-xs text-destructive">{nwcError}</p>}
                  <p className="text-xs text-muted-foreground">
                    Get this from your Lightning wallet (Alby, Mutiny, etc.)
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleNwcConnect}>
                      Connect Wallet
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowNwcInput(false);
                        setNwcInput('');
                        setNwcError(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNwcInput(true)}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-1.5" />
                  Connect Lightning Wallet
                </Button>
              )}
            </div>

            {/* Nostr profile link */}
            {profile?.nip05 && (
              <div className="text-xs text-muted-foreground">NIP-05: {profile.nip05}</div>
            )}
          </div>
        ) : (
          /* Not connected - show connection options */
          <div className="space-y-3">
            {/* NIP-07 Extension */}
            {hasExtension ? (
              <Button
                onClick={connectWithExtension}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Key className="h-4 w-4 mr-2" />
                {loading ? 'Connecting...' : 'Connect with Extension'}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button disabled className="w-full" variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  No Nostr Extension Found
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Install{' '}
                  <a
                    href="https://getalby.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    Alby <ExternalLink className="h-3 w-3" />
                  </a>{' '}
                  or{' '}
                  <a
                    href="https://github.com/niccokunzmann/nos2x"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    nos2x <ExternalLink className="h-3 w-3" />
                  </a>{' '}
                  for the best experience.
                </p>
              </div>
            )}

            {/* Manual npub entry */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {showNpubInput ? (
              <div className="space-y-2">
                <Input
                  placeholder="npub1..."
                  value={npubInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNpubInput(e.target.value)
                  }
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleNpubConnect}
                    disabled={!npubInput.trim() || loading}
                  >
                    {loading ? 'Connecting...' : 'Link npub'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowNpubInput(false);
                      setNpubInput('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNpubInput(true)}
                className="w-full text-muted-foreground"
              >
                Enter npub manually
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
