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
    id: 'brave',
    name: 'Brave Wallet',
    type: 'browser',
    description: 'Built-in wallet in the Brave browser. Simple, secure, and perfect for beginners.',
    pros: [
      'Already built into Brave browser',
      'No additional downloads needed',
      'Self-custody - you control your keys',
      'Multi-chain support (Bitcoin, Ethereum, Solana)',
      'Easy to use interface',
    ],
    cons: ['Only available in Brave browser', 'Relatively new compared to other wallets'],
    difficulty: 'beginner',
    downloadUrl: 'https://brave.com/',
    supportedPlatforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
    features: ['Self-custody', 'Multi-chain', 'Browser integrated', 'Open source'],
    recommended: true,
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
