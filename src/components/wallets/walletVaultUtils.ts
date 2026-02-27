import { Bitcoin, Zap, Users, Building, Heart } from 'lucide-react';
import type { WalletAddress } from './WalletVault';

export function getTypeIconName(
  type: WalletAddress['type']
): 'Bitcoin' | 'Zap' | 'Ethereum' | 'Solana' | 'Other' {
  switch (type) {
    case 'bitcoin':
      return 'Bitcoin';
    case 'lightning':
      return 'Zap';
    case 'ethereum':
      return 'Ethereum';
    case 'solana':
      return 'Solana';
    default:
      return 'Other';
  }
}

export function getLucideTypeIcon(type: WalletAddress['type']) {
  switch (type) {
    case 'bitcoin':
      return Bitcoin;
    case 'lightning':
      return Zap;
    default:
      return null; // ethereum/solana use text symbols, handled in TSX
  }
}

export function getCategoryIcon(category: WalletAddress['category']) {
  switch (category) {
    case 'organization':
    case 'business':
      return Building;
    case 'project':
    case 'donation':
      return Heart;
    case 'personal':
    case 'friend':
    default:
      return Users;
  }
}

export function getCategoryColor(category: WalletAddress['category']): string {
  switch (category) {
    case 'personal':
      return 'bg-blue-100 text-blue-700';
    case 'organization':
      return 'bg-purple-100 text-purple-700';
    case 'project':
      return 'bg-pink-100 text-pink-700';
    case 'friend':
      return 'bg-green-100 text-green-700';
    case 'business':
      return 'bg-orange-100 text-orange-700';
    case 'donation':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function formatAddress(address: string): string {
  if (address.length <= 20) {
    return address;
  }
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}
