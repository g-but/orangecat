'use client';

import { motion } from 'framer-motion';
import { Bitcoin, Smartphone, Monitor, Globe, Lock, Star, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { componentColors } from '@/lib/theme';
import type { WalletOption } from './config';

function getTypeIcon(type: WalletOption['type']) {
  switch (type) {
    case 'mobile':
      return Smartphone;
    case 'desktop':
      return Monitor;
    case 'browser':
      return Globe;
    case 'hardware':
      return Lock;
    default:
      return Bitcoin;
  }
}

function getDifficultyColor(difficulty: WalletOption['difficulty']) {
  switch (difficulty) {
    case 'beginner':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'intermediate':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'advanced':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

interface WalletCardProps {
  wallet: WalletOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function WalletCard({ wallet, isSelected, onSelect }: WalletCardProps) {
  const TypeIcon = getTypeIcon(wallet.type);

  return (
    <motion.div layout whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card
        className={`cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'ring-2 ring-bitcoinOrange border-bitcoinOrange shadow-lg'
            : 'hover:shadow-md border-gray-200'
        } ${wallet.recommended ? 'ring-1 ring-green-200 bg-green-50/30' : ''}`}
        onClick={() => onSelect(wallet.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isSelected ? componentColors.bitcoinElement.className : 'bg-gray-100'}`}
              >
                <TypeIcon
                  className={`w-5 h-5 ${isSelected ? 'text-bitcoinOrange' : 'text-gray-600'}`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{wallet.name}</CardTitle>
                  {wallet.recommended && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <Star className="w-3 h-3" />
                      Recommended
                    </div>
                  )}
                </div>
                <div
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(wallet.difficulty)}`}
                >
                  {wallet.difficulty.charAt(0).toUpperCase() + wallet.difficulty.slice(1)}
                </div>
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 transition-transform ${isSelected ? 'rotate-90 text-bitcoinOrange' : 'text-gray-400'}`}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <CardDescription className="mb-4">{wallet.description}</CardDescription>
          <div className="flex flex-wrap gap-2 mb-4">
            {wallet.features.map(feature => (
              <span
                key={feature}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
              >
                {feature}
              </span>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Platforms:</strong> {wallet.supportedPlatforms.join(', ')}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
