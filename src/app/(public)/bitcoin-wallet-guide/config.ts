import { Bitcoin, Download, Shield, CheckCircle } from 'lucide-react';
import { WALLET_PROVIDERS, type WalletFormFactor } from '@/config/wallet-providers';

export interface WalletOption {
  id: string;
  name: string;
  type: WalletFormFactor;
  description: string;
  pros: string[];
  cons: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  logoUrl?: string;
  downloadUrl: string;
  supportedPlatforms: string[];
  features: string[];
  recommended?: boolean;
}

/**
 * Editorial only. Name, URL, platforms and form factor come from
 * `@/config/wallet-providers` — the same record the Cat reads — so this page and
 * the Cat can never recommend the same wallet with different details.
 */
type WalletEditorial = Pick<
  WalletOption,
  'description' | 'pros' | 'cons' | 'difficulty' | 'features' | 'recommended'
>;

const GUIDE_EDITORIAL: Array<{ providerId: string } & WalletEditorial> = [
  {
    providerId: 'primal',
    description:
      'The fastest way to start receiving on OrangeCat. Install it and you get a Lightning address (like name@primal.net) in about a minute — exactly what OrangeCat needs to receive tips and funding.',
    pros: [
      'Gives you a Lightning address in ~1 minute',
      'Instant, near-zero-fee receiving',
      'Beautiful, genuinely beginner-friendly app',
      'Works directly with your OrangeCat address',
    ],
    cons: ['Mobile only', 'Starts custodial — you can move to self-custody later'],
    difficulty: 'beginner',
    features: ['Lightning address', 'Instant receiving', 'Beginner-friendly'],
    recommended: true,
  },
  {
    providerId: 'brave',
    description:
      'Built-in wallet in the Brave browser. Good for holding on-chain Bitcoin, but it has no Lightning support — so it cannot receive Lightning tips or back a name@orangecat.ch address.',
    pros: [
      'Already built into Brave browser',
      'No additional downloads needed',
      'Self-custody - you control your keys',
      'Multi-chain support (Bitcoin, Ethereum, Solana)',
    ],
    cons: [
      'No Lightning support — cannot receive Lightning tips or a Lightning address',
      'Only available in Brave browser',
    ],
    difficulty: 'beginner',
    features: ['Self-custody', 'Multi-chain', 'Browser integrated', 'Open source'],
  },
  {
    providerId: 'bluewallet',
    description: 'Popular Bitcoin-only mobile wallet with Lightning Network support.',
    pros: [
      'Bitcoin-only focus',
      'Lightning Network support',
      'Clean, intuitive interface',
      'Open source',
      'Watch-only wallet support',
    ],
    cons: ['Mobile only', 'May be complex for absolute beginners'],
    difficulty: 'beginner',
    features: ['Bitcoin-only', 'Lightning Network', 'Open source', 'Watch-only wallets'],
  },
  {
    providerId: 'exodus',
    description:
      'User-friendly desktop wallet with beautiful design and multi-cryptocurrency support.',
    pros: [
      'Beautiful, intuitive interface',
      'Built-in exchange features',
      'Multi-cryptocurrency support',
      'Good customer support',
      'Portfolio tracking',
    ],
    cons: ['Not open source', 'Higher fees for built-in exchange', 'Less privacy-focused'],
    difficulty: 'beginner',
    features: ['Multi-crypto', 'Built-in exchange', 'Portfolio tracking', 'Mobile & desktop'],
  },
  {
    providerId: 'electrum',
    description: 'Lightweight Bitcoin wallet focused on speed and low resource usage.',
    pros: [
      'Very lightweight and fast',
      'Bitcoin-only focus',
      'Advanced features for power users',
      'Open source',
      'Hardware wallet support',
    ],
    cons: [
      'Interface can be intimidating for beginners',
      'No built-in exchange',
      'Requires more technical knowledge',
    ],
    difficulty: 'intermediate',
    features: ['Bitcoin-only', 'Lightweight', 'Hardware wallet support', 'Advanced features'],
  },
];

export const walletOptions: WalletOption[] = GUIDE_EDITORIAL.map(({ providerId, ...editorial }) => {
  const provider = WALLET_PROVIDERS[providerId];
  return {
    id: provider.id,
    name: provider.name,
    type: provider.formFactor,
    downloadUrl: provider.website,
    supportedPlatforms: provider.platforms,
    ...editorial,
  };
});

export const setupSteps = [
  {
    title: 'Choose Your Wallet Type',
    description: 'Different wallets work better for different needs and experience levels.',
    icon: Bitcoin,
  },
  {
    title: 'Download & Install',
    description: 'Get your chosen wallet from the official website or app store.',
    icon: Download,
  },
  {
    title: 'Create Your Wallet',
    description: 'Follow the setup process and securely save your recovery phrase.',
    icon: Shield,
  },
  {
    title: 'Get Your Address',
    description: 'Copy your Bitcoin receiving address to use on OrangeCat.',
    icon: CheckCircle,
  },
];
