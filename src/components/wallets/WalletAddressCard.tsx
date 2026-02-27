'use client';

import { motion } from 'framer-motion';
import { Copy, Check, Edit, Trash2, Heart, Clock, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import type { WalletAddress } from './WalletVault';
import {
  getLucideTypeIcon,
  getCategoryIcon,
  getCategoryColor,
  formatAddress,
} from './walletVaultUtils';

function TypeIconDisplay({ type }: { type: WalletAddress['type'] }) {
  const LucideIcon = getLucideTypeIcon(type);
  if (LucideIcon) {
    return <LucideIcon />;
  }
  if (type === 'ethereum') {
    return <span className="font-bold text-bitcoinOrange">Ξ</span>;
  }
  if (type === 'solana') {
    return <span className="font-bold text-bitcoinOrange">◎</span>;
  }
  return <span className="font-bold text-bitcoinOrange">₿</span>;
}

interface WalletAddressCardProps {
  address: WalletAddress;
  index: number;
  copiedAddress: string | null;
  onCopy: (address: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function WalletAddressCard({
  address,
  index,
  copiedAddress,
  onCopy,
  onToggleFavorite,
}: WalletAddressCardProps) {
  const CategoryIcon = getCategoryIcon(address.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-200 border-2 hover:border-bitcoinOrange/50">
        <div className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-bitcoinOrange/10 rounded-lg">
              <TypeIconDisplay type={address.type} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg truncate">{address.name}</h3>
                {address.isFavorite && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getCategoryColor(address.category)}>
                  <CategoryIcon className="w-3 h-3 mr-1" />
                  {address.category}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-0">
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Address</p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono flex-1 break-all">
                {formatAddress(address.address)}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCopy(address.address)}
                aria-label="Copy address"
                className="flex-shrink-0"
              >
                {copiedAddress === address.address ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {address.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">{address.description}</p>
            </div>
          )}

          {address.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1">
              {address.tags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Used {address.usageCount}x
              </span>
              {address.lastUsed && (
                <span>Last: {new Date(address.lastUsed).toLocaleDateString()}</span>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onToggleFavorite(address.id)}
                aria-label={address.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Heart
                  className={`w-3 h-3 ${address.isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Edit address"
                className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Delete address"
                className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
