'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Wallet } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import type { GroupWalletSummary } from '@/services/groups/types';
import { GroupWalletCard } from './GroupWalletCard';
import { GroupWalletCreateForm } from './GroupWalletCreateForm';

interface GroupWalletsProps {
  groupId: string;
  groupSlug: string;
  wallets: unknown[];
  onUpdate?: () => void;
}

// Type guard for wallet summary
const isWalletSummary = (w: unknown): w is GroupWalletSummary => {
  return typeof w === 'object' && w !== null && 'id' in w && 'name' in w;
};

export function GroupWallets({
  groupId: _groupId,
  groupSlug,
  wallets,
  onUpdate,
}: GroupWalletsProps) {
  const typedWallets = wallets.filter(isWalletSummary);

  return (
    <div className="space-y-4">
      <GroupWalletCreateForm groupSlug={groupSlug} onCreated={onUpdate} />

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
            <EmptyState
              icon={Wallet}
              title="No wallets yet"
              description="Use “Create a group wallet” above to add a Bitcoin wallet so this group can receive funds together."
              className="py-8"
            />
          ) : (
            <div className="space-y-4">
              {typedWallets.map(wallet => (
                <GroupWalletCard
                  key={wallet.id}
                  wallet={wallet}
                  groupSlug={groupSlug}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
