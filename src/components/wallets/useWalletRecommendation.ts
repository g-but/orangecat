/**
 * useWalletRecommendation Hook
 *
 * Manages wallet recommendation state and scoring logic.
 * Extracted from WalletRecommendation component.
 */

'use client';

import { useState, useMemo } from 'react';

export interface UserPreferences {
  experience: 'beginner' | 'intermediate' | 'advanced';
  privacy: 'low' | 'medium' | 'high';
  custody: 'custodial' | 'self-custody';
  frequency: 'occasional' | 'regular' | 'frequent';
  amount: 'small' | 'medium' | 'large';
  device: 'mobile' | 'desktop' | 'both';
  features: string[];
}

export interface WalletInfo {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'hardware' | 'browser';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  privacyLevel: 'low' | 'medium' | 'high';
  custody: 'custodial' | 'self-custody';
  features: string[];
  rating: number;
  recommended: boolean;
  downloadUrl?: string;
}

export interface WalletRecommendation {
  wallet: WalletInfo;
  score: number;
  reasons: string[];
  pros: string[];
  cons: string[];
}

const DEFAULT_WALLETS: WalletInfo[] = [
  {
    id: 'blue-wallet',
    name: 'BlueWallet',
    type: 'mobile',
    difficulty: 'beginner',
    privacyLevel: 'medium',
    custody: 'self-custody',
    features: ['lightning', 'watch-only', 'open-source'],
    rating: 4.6,
    recommended: true,
    downloadUrl: 'https://bluewallet.io',
  },
  {
    id: 'electrum',
    name: 'Electrum',
    type: 'desktop',
    difficulty: 'intermediate',
    privacyLevel: 'high',
    custody: 'self-custody',
    features: ['hardware-wallet', 'advanced-privacy', 'open-source'],
    rating: 4.5,
    recommended: false,
    downloadUrl: 'https://electrum.org',
  },
  {
    id: 'ledger-nano',
    name: 'Ledger Nano',
    type: 'hardware',
    difficulty: 'intermediate',
    privacyLevel: 'high',
    custody: 'self-custody',
    features: ['hardware-security', 'multi-crypto', 'offline-storage'],
    rating: 4.8,
    recommended: true,
    downloadUrl: 'https://www.ledger.com',
  },
];

function calculateRecommendations(
  wallets: WalletInfo[],
  preferences: UserPreferences
): WalletRecommendation[] {
  return wallets
    .map(wallet => {
      let score = 0;
      const reasons: string[] = [];
      const pros: string[] = [];
      const cons: string[] = [];

      // Experience level scoring
      if (preferences.experience === 'beginner' && wallet.difficulty === 'beginner') {
        score += 30;
        reasons.push('Perfect for beginners');
        pros.push('Easy to use interface');
      } else if (
        preferences.experience === 'intermediate' &&
        wallet.difficulty === 'intermediate'
      ) {
        score += 25;
        reasons.push('Matches your experience level');
      } else if (preferences.experience === 'advanced' && wallet.difficulty === 'advanced') {
        score += 20;
        reasons.push('Advanced features for power users');
      }

      // Privacy level scoring
      if (preferences.privacy === 'high' && wallet.privacyLevel === 'high') {
        score += 25;
        reasons.push('High privacy protection');
        pros.push('Strong privacy features');
      } else if (preferences.privacy === 'medium' && wallet.privacyLevel === 'medium') {
        score += 20;
        reasons.push('Good balance of privacy and usability');
      }

      // Custody preference scoring
      if (preferences.custody === wallet.custody) {
        score += 20;
        reasons.push(`Matches your ${wallet.custody} preference`);
        if (wallet.custody === 'self-custody') {
          pros.push('You control your private keys');
        } else {
          pros.push('Convenient custodial service');
        }
      }

      // Device preference scoring
      if (preferences.device === 'both' || preferences.device === wallet.type) {
        score += 15;
        reasons.push(`Works on your preferred device (${wallet.type})`);
      }

      // Features scoring
      if (preferences.features.length > 0) {
        const matchingFeatures = wallet.features.filter(f =>
          preferences.features.some(pf => f.toLowerCase().includes(pf.toLowerCase()))
        );
        score += matchingFeatures.length * 5;
        if (matchingFeatures.length > 0) {
          reasons.push(`Supports ${matchingFeatures.length} of your preferred features`);
        }
      }

      // Rating bonus
      score += (wallet.rating - 4) * 5;

      // Recommended bonus
      if (wallet.recommended) {
        score += 10;
        reasons.push('Highly recommended by experts');
      }

      return {
        wallet,
        score: Math.round(score),
        reasons,
        pros,
        cons,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function useWalletRecommendation(customWallets?: WalletInfo[]) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    experience: 'beginner',
    privacy: 'medium',
    custody: 'self-custody',
    frequency: 'regular',
    amount: 'medium',
    device: 'both',
    features: [],
  });

  const [showResults, setShowResults] = useState(false);

  const wallets = customWallets || DEFAULT_WALLETS;

  const recommendations = useMemo(
    () => calculateRecommendations(wallets, preferences),
    [wallets, preferences]
  );

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return {
    preferences,
    setPreferences,
    updatePreference,
    showResults,
    setShowResults,
    recommendations,
    wallets,
  };
}
