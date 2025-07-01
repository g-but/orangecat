/**
 * ASSETS INITIATIVE MODULE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Extracted from main initiatives.ts for modular architecture
 */

import type { Initiative } from '@/types/initiative';

export const assets: Initiative = {
  id: 'assets',
  name: 'Assets',
  icon: 'Coins',
  color: {
    primary: 'yellow-600',
    gradient: 'from-yellow-500 to-amber-500',
    bg: 'yellow-100',
    text: 'yellow-600',
    border: 'yellow-200'
  },
  description: 'Manage digital assets, create Bitcoin-backed tokens, and build decentralized financial products.',
  longDescription: 'Issue tokens, manage portfolios, create stablecoins, and build innovative financial instruments powered by Bitcoin and Lightning.',
  status: 'coming-soon',  
  timeline: 'Q4 2026',
  routes: {
    landing: '/assets',
    demo: '/demo/assets',
    comingSoon: '/coming-soon?feature=assets'
  },
  features: [
    {
      icon: 'Coins',
      title: 'Asset Creation',
      description: 'Create and manage digital assets backed by Bitcoin security and transparency.',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: 'LineChart',
      title: 'Portfolio Management',
      description: 'Track and manage your digital asset portfolio with real-time analytics.',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: 'Shield',
      title: 'Bitcoin Security',
      description: 'All assets are secured by Bitcoin\'s proof-of-work consensus mechanism.',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      icon: 'DollarSign',
      title: 'Stablecoin Support',
      description: 'Create and manage Bitcoin-backed stablecoins with automatic collateralization.',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: 'BarChart',
      title: 'Market Analytics',
      description: 'Access comprehensive market data and analytics for all supported assets.',
      color: 'text-red-600 bg-red-100'
    },
    {
      icon: 'Zap',
      title: 'Lightning Integration',
      description: 'Instant asset transfers using Bitcoin Lightning Network for speed and low fees.',
      color: 'text-yellow-600 bg-yellow-100'
    }
  ],
  types: [
    { 
      name: 'Bitcoin-Backed Tokens', 
      icon: 'Coins',
      description: 'Tokens collateralized by Bitcoin',
      example: 'Wrapped Bitcoin (WBTC)',
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    { 
      name: 'Stablecoins', 
      icon: 'DollarSign',
      description: 'Price-stable cryptocurrencies',
      example: 'USD-pegged stablecoin',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    { 
      name: 'Utility Tokens', 
      icon: 'Cpu',
      description: 'Platform and service access tokens',
      example: 'Platform governance token',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    { 
      name: 'NFTs', 
      icon: 'Image',
      description: 'Non-fungible tokens and collectibles',
      example: 'Digital art collection',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    { 
      name: 'Yield Tokens', 
      icon: 'TrendingUp',
      description: 'Interest-bearing investment tokens',
      example: 'Bitcoin yield farming token',
      color: 'bg-pink-100 text-pink-700 border-pink-200'
    },
    { 
      name: 'Derivatives', 
      icon: 'BarChart',
      description: 'Financial derivatives and options',
      example: 'Bitcoin futures contract',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    }
  ],
  capabilities: [
    'Asset tokenization',
    'Portfolio tracking',
    'Market analytics',
    'Liquidity provision',
    'Yield farming',
    'Staking rewards',
    'Cross-chain bridges',
    'Atomic swaps',
    'Price oracles',
    'Risk management'
  ],
  useCases: [
    'Create Bitcoin-backed investment funds',
    'Launch stablecoins with Bitcoin collateral',
    'Tokenize real-world assets',
    'Build decentralized trading platforms'
  ],
  marketTools: [
    {
      name: 'Coinbase',
      description: 'Cryptocurrency exchange and asset management',
      url: 'https://coinbase.com',
      icon: 'DollarSign',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Uniswap',
      description: 'Decentralized asset exchange',
      url: 'https://uniswap.org',
      icon: 'ArrowRightLeft',
      color: 'bg-pink-100 text-pink-600'
    },
    {
      name: 'MakerDAO',
      description: 'Decentralized stablecoin platform',
      url: 'https://makerdao.com',
      icon: 'Coins',
      color: 'bg-orange-100 text-orange-600'
    }
  ]
}; 