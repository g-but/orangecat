import { Bitcoin, Download, Shield, CheckCircle } from 'lucide-react';

export interface WalletOption {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'browser' | 'hardware';
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

export const walletOptions: WalletOption[] = [
  {
    id: 'primal',
    name: 'Primal',
    type: 'mobile',
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
    downloadUrl: 'https://primal.net/downloads',
    supportedPlatforms: ['iOS', 'Android'],
    features: ['Lightning address', 'Instant receiving', 'Beginner-friendly'],
    recommended: true,
  },
  {
    id: 'brave',
    name: 'Brave Wallet',
    type: 'browser',
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
    downloadUrl: 'https://brave.com/',
    supportedPlatforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
    features: ['Self-custody', 'Multi-chain', 'Browser integrated', 'Open source'],
  },
  {
    id: 'blue-wallet',
    name: 'BlueWallet',
    type: 'mobile',
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
    downloadUrl: 'https://bluewallet.io/',
    supportedPlatforms: ['iOS', 'Android'],
    features: ['Bitcoin-only', 'Lightning Network', 'Open source', 'Watch-only wallets'],
  },
  {
    id: 'exodus',
    name: 'Exodus',
    type: 'desktop',
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
    downloadUrl: 'https://www.exodus.com/',
    supportedPlatforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
    features: ['Multi-crypto', 'Built-in exchange', 'Portfolio tracking', 'Mobile & desktop'],
  },
  {
    id: 'electrum',
    name: 'Electrum',
    type: 'desktop',
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
    downloadUrl: 'https://electrum.org/',
    supportedPlatforms: ['Windows', 'macOS', 'Linux', 'Android'],
    features: ['Bitcoin-only', 'Lightweight', 'Hardware wallet support', 'Advanced features'],
  },
];

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
