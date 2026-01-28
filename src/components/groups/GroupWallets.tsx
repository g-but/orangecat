/**
 * Group Wallets Component
 *
 * Unified wallet/treasury management for groups.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-12-30
 * Last Modified Summary: Fixed to use required_signatures instead of authorized_users_count
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, Copy, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import type { GroupWalletSummary } from '@/services/groups/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface GroupWalletsProps {
  groupId: string;
  groupSlug: string;
  wallets: unknown[];
  onUpdate?: () => void;
}

export function GroupWallets({
  groupId: _groupId,
  groupSlug,
  wallets,
  onUpdate,
}: GroupWalletsProps) {
  const { user: _user } = useAuth();
  const _router = useRouter();
  const { formatAmount } = useDisplayCurrency();
  const [_creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const handleRefreshBalance = async (walletId: string) => {
    try {
      setRefreshing(walletId);
      const response = await fetch(`/api/groups/${groupSlug}/wallets/${walletId}/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refresh balance');
      }

      const data = await response.json();
      toast.success(`Balance updated: ${formatAmount(data.data?.balance || 0)}`);
      onUpdate?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh balance');
    } finally {
      setRefreshing(null);
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  // Type guard for wallet summary
  const isWalletSummary = (w: unknown): w is GroupWalletSummary => {
    return typeof w === 'object' && w !== null && 'id' in w && 'name' in w;
  };

  const typedWallets = wallets.filter(isWalletSummary);

  return (
    <div className="space-y-4">
      {/* Create Wallet Button */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={() => setCreating(true)} className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create New Wallet
          </Button>
        </CardContent>
      </Card>

      {/* Wallets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallets ({typedWallets.length})
          </CardTitle>
          <CardDescription>Bitcoin wallets for this group</CardDescription>
        </CardHeader>
        <CardContent>
          {typedWallets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No wallets yet</div>
          ) : (
            <div className="space-y-4">
              {typedWallets.map(wallet => (
                <Card key={wallet.id} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{wallet.name}</CardTitle>
                      {wallet.is_active ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-700 border-green-200"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {wallet.description && <CardDescription>{wallet.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {wallet.purpose && (
                      <div className="text-sm">
                        <span className="text-gray-500">Purpose: </span>
                        <span className="font-medium capitalize">{wallet.purpose}</span>
                      </div>
                    )}

                    {wallet.bitcoin_address && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Bitcoin Address</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 font-mono text-xs break-all text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            {wallet.bitcoin_address}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyAddress(wallet.bitcoin_address!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              window.open(
                                `https://blockstream.info/address/${wallet.bitcoin_address}`,
                                '_blank'
                              )
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {wallet.lightning_address && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Lightning Address</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            {wallet.lightning_address}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyAddress(wallet.lightning_address!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm text-gray-500">Balance</div>
                            <div className="text-lg font-bold text-green-600">
                              {formatAmount(wallet.current_balance_sats)}
                            </div>
                          </div>
                          {wallet.bitcoin_address && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRefreshBalance(wallet.id)}
                              disabled={refreshing === wallet.id}
                              className="ml-auto"
                            >
                              {refreshing === wallet.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      {wallet.required_signatures > 1 && (
                        <div className="text-sm text-gray-500">
                          Multi-sig: {wallet.required_signatures} signatures required
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
