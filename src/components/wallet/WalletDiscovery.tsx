'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bitcoin,
  Smartphone,
  Monitor,
  Globe,
  Lock,
  Shield,
  Zap,
  Users,
  Eye,
  EyeOff,
  Filter,
  Search,
  Star,
  CheckCircle,
  AlertTriangle,
  Download,
  ExternalLink,
  RefreshCw,
  Heart,
  TrendingUp,
  Award,
  Settings
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface WalletProvider {
  id: string
  name: string
  type: 'mobile' | 'desktop' | 'browser' | 'hardware'
  description: string
  longDescription: string
  pros: string[]
  cons: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  logoUrl?: string
  downloadUrl: string
  supportedPlatforms: string[]
  features: string[]
  privacyLevel: 'low' | 'medium' | 'high'
  custody: 'custodial' | 'self-custody' | 'hybrid'
  countries: string[]
  supportedNetworks: string[]
  setupTime: number // minutes
  securityFeatures: string[]
  recommended?: boolean
  rating: number
  reviewCount: number
  lastUpdated: string
  verified: boolean
  fees: 'free' | 'low' | 'medium' | 'high'
}

const walletProviders: WalletProvider[] = [
  // Hardware Wallets
  {
    id: 'ledger-nano',
    name: 'Ledger Nano',
    type: 'hardware',
    description: 'The gold standard for Bitcoin security. Store your keys offline.',
    longDescription: 'Ledger Nano series offers the highest level of security for Bitcoin storage. Your private keys never leave the device, making it virtually impossible for hackers to steal your Bitcoin.',
    pros: [
      'Military-grade security',
      'Offline private key storage',
      'Supports multiple cryptocurrencies',
      'Built-in display for transaction verification',
      'PIN protection and recovery phrase'
    ],
    cons: [
      'Requires physical device ($59-$149)',
      'Not as convenient for frequent transactions',
      'Learning curve for beginners'
    ],
    difficulty: 'intermediate',
    downloadUrl: 'https://www.ledger.com/',
    supportedPlatforms: ['Hardware device'],
    features: ['Hardware security', 'Offline storage', 'Multi-crypto support', 'PIN protection', 'Recovery phrase'],
    privacyLevel: 'high',
    custody: 'self-custody',
    countries: ['All countries'],
    supportedNetworks: ['Bitcoin', 'Lightning'],
    setupTime: 15,
    securityFeatures: ['Hardware security module', 'Secure element', 'PIN protection', 'Recovery phrase'],
    recommended: true,
    rating: 4.8,
    reviewCount: 15420,
    lastUpdated: '2024-01-15',
    verified: true,
    fees: 'low'
  },
  {
    id: 'trezor',
    name: 'Trezor',
    type: 'hardware',
    description: 'Open-source hardware wallet with excellent privacy features.',
    longDescription: 'Trezor was the first hardware wallet ever created. It offers excellent privacy, open-source firmware, and supports Bitcoin and Lightning Network.',
    pros: [
      'Open-source firmware',
      'Excellent privacy features',
      'Bitcoin-only model available',
      'No data collection',
      'Community trusted'
    ],
    cons: [
      'Requires physical device ($49-$179)',
      'Touch interface on newer models',
      'Firmware updates required'
    ],
    difficulty: 'intermediate',
    downloadUrl: 'https://trezor.io/',
    supportedPlatforms: ['Hardware device'],
    features: ['Open source', 'Privacy focused', 'Bitcoin-only option', 'Community support'],
    privacyLevel: 'high',
    custody: 'self-custody',
    countries: ['All countries'],
    supportedNetworks: ['Bitcoin', 'Lightning'],
    setupTime: 12,
    securityFeatures: ['Open-source firmware', 'No data collection', 'Hardware security', 'Recovery phrase'],
    recommended: true,
    rating: 4.7,
    reviewCount: 8930,
    lastUpdated: '2024-01-10',
    verified: true,
    fees: 'low'
  },

  // Software Wallets
  {
    id: 'electrum',
    name: 'Electrum',
    type: 'desktop',
    description: 'Lightweight, fast Bitcoin wallet focused on advanced features.',
    longDescription: 'Electrum is one of the oldest and most trusted Bitcoin wallets. It\'s lightweight, secure, and offers advanced features for power users.',
    pros: [
      'Very fast and lightweight',
      'Advanced privacy features',
      'Hardware wallet support',
      'Open source',
      'No downtime - decentralized servers'
    ],
    cons: [
      'Interface can be intimidating for beginners',
      'No built-in exchange features',
      'Requires technical knowledge for advanced features'
    ],
    difficulty: 'intermediate',
    downloadUrl: 'https://electrum.org/',
    supportedPlatforms: ['Windows', 'macOS', 'Linux', 'Android'],
    features: ['Lightning Network', 'Hardware wallet support', 'Advanced privacy', 'Open source'],
    privacyLevel: 'high',
    custody: 'self-custody',
    countries: ['All countries'],
    supportedNetworks: ['Bitcoin', 'Lightning'],
    setupTime: 8,
    securityFeatures: ['SPV verification', 'Hardware wallet support', 'No data collection', 'Recovery phrase'],
    recommended: false,
    rating: 4.5,
    reviewCount: 12340,
    lastUpdated: '2024-01-12',
    verified: true,
    fees: 'free'
  },
  {
    id: 'blue-wallet',
    name: 'BlueWallet',
    type: 'mobile',
    description: 'Beautiful Bitcoin wallet with Lightning Network support.',
    longDescription: 'BlueWallet is a popular Bitcoin-only mobile wallet that supports both Bitcoin and Lightning Network payments. It has a clean, intuitive interface.',
    pros: [
      'Bitcoin-only focus',
      'Lightning Network support',
      'Clean, intuitive interface',
      'Watch-only wallet support',
      'Open source'
    ],
    cons: [
      'Mobile only',
      'No desktop version',
      'Limited to Bitcoin ecosystem'
    ],
    difficulty: 'beginner',
    downloadUrl: 'https://bluewallet.io/',
    supportedPlatforms: ['iOS', 'Android'],
    features: ['Lightning Network', 'Watch-only wallets', 'Open source', 'Bitcoin-only'],
    privacyLevel: 'medium',
    custody: 'self-custody',
    countries: ['All countries'],
    supportedNetworks: ['Bitcoin', 'Lightning'],
    setupTime: 5,
    securityFeatures: ['PIN protection', 'Biometric authentication', 'Recovery phrase', 'No data collection'],
    recommended: true,
    rating: 4.6,
    reviewCount: 8760,
    lastUpdated: '2024-01-08',
    verified: true,
    fees: 'free'
  },
  {
    id: 'phoenix',
    name: 'Phoenix Wallet',
    type: 'mobile',
    description: 'Modern Lightning wallet with excellent UX and privacy.',
    longDescription: 'Phoenix is a non-custodial Lightning wallet that offers excellent privacy, low fees, and a beautiful interface. Perfect for Lightning payments.',
    pros: [
      'Non-custodial Lightning wallet',
      'Excellent privacy features',
      'Low Lightning fees',
      'Beautiful, modern interface',
      'Open source'
    ],
    cons: [
      'Lightning-only (no on-chain Bitcoin)',
      'Requires understanding of Lightning',
      'Mobile only'
    ],
    difficulty: 'beginner',
    downloadUrl: 'https://phoenix.acinq.co/',
    supportedPlatforms: ['iOS', 'Android'],
    features: ['Lightning Network', 'Privacy focused', 'Open source', 'Low fees'],
    privacyLevel: 'high',
    custody: 'self-custody',
    countries: ['All countries'],
    supportedNetworks: ['Lightning'],
    setupTime: 3,
    securityFeatures: ['No data collection', 'Tor support', 'Recovery phrase', 'PIN protection'],
    recommended: true,
    rating: 4.4,
    reviewCount: 5430,
    lastUpdated: '2024-01-05',
    verified: true,
    fees: 'low'
  },

  // Browser Wallets
  {
    id: 'brave-wallet',
    name: 'Brave Wallet',
    type: 'browser',
    description: 'Built-in wallet in Brave browser - simple and secure.',
    longDescription: 'Brave Wallet is built directly into the Brave browser, making it incredibly convenient for web3 users. It supports Bitcoin and other cryptocurrencies.',
    pros: [
      'Built into Brave browser',
      'No additional downloads needed',
      'Self-custody - you control your keys',
      'Multi-chain support',
      'Easy to use interface'
    ],
    cons: [
      'Only available in Brave browser',
      'Relatively new compared to other wallets',
      'Limited mobile support'
    ],
    difficulty: 'beginner',
    downloadUrl: 'https://brave.com/wallet/',
    supportedPlatforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
    features: ['Browser integrated', 'Multi-chain', 'Self-custody', 'Open source'],
    privacyLevel: 'medium',
    custody: 'self-custody',
    countries: ['All countries'],
    supportedNetworks: ['Bitcoin', 'Ethereum', 'Solana'],
    setupTime: 2,
    securityFeatures: ['Browser isolation', 'Recovery phrase', 'No data collection', 'Open source'],
    recommended: true,
    rating: 4.3,
    reviewCount: 4320,
    lastUpdated: '2024-01-03',
    verified: true,
    fees: 'free'
  },

  // Custodial Wallets
  {
    id: 'cash-app',
    name: 'Cash App',
    type: 'mobile',
    description: 'Popular payment app with Bitcoin support.',
    longDescription: 'Cash App is a widely used payment app that also supports Bitcoin. It\'s great for beginners but keep in mind it\'s custodial - Cash App holds your keys.',
    pros: [
      'Very easy to use',
      'Widely adopted',
      'Lightning Network support',
      'Can buy Bitcoin instantly',
      'Good customer support'
    ],
    cons: [
      'Custodial - not your keys',
      'KYC required',
      'Higher fees',
      'Limited privacy'
    ],
    difficulty: 'beginner',
    downloadUrl: 'https://cash.app/bitcoin',
    supportedPlatforms: ['iOS', 'Android'],
    features: ['Lightning Network', 'Easy buying', 'Custodial', 'Mobile payments'],
    privacyLevel: 'low',
    custody: 'custodial',
    countries: ['US', 'UK'],
    supportedNetworks: ['Bitcoin', 'Lightning'],
    setupTime: 3,
    securityFeatures: ['PIN protection', 'Biometric auth', 'Recovery options', 'Insurance'],
    recommended: false,
    rating: 4.1,
    reviewCount: 15670,
    lastUpdated: '2024-01-01',
    verified: true,
    fees: 'medium'
  }
]

interface WalletFilters {
  type: string[]
  difficulty: string[]
  privacy: string[]
  custody: string[]
  countries: string[]
  features: string[]
  search: string
}

export default function WalletDiscovery() {
  const [filters, setFilters] = useState<WalletFilters>({
    type: [],
    difficulty: [],
    privacy: [],
    custody: [],
    countries: [],
    features: [],
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider | null>(null)

  const filteredWallets = useMemo(() => {
    return walletProviders.filter(wallet => {
      // Search filter
      if (filters.search && !wallet.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !wallet.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(wallet.type)) {
        return false
      }

      // Difficulty filter
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(wallet.difficulty)) {
        return false
      }

      // Privacy filter
      if (filters.privacy.length > 0 && !filters.privacy.includes(wallet.privacyLevel)) {
        return false
      }

      // Custody filter
      if (filters.custody.length > 0 && !filters.custody.includes(wallet.custody)) {
        return false
      }

      // Features filter
      if (filters.features.length > 0) {
        const hasAllFeatures = filters.features.every(feature =>
          wallet.features.some(f => f.toLowerCase().includes(feature.toLowerCase()))
        )
        if (!hasAllFeatures) return false
      }

      return true
    })
  }, [filters])

  const getTypeIcon = (type: WalletProvider['type']) => {
    switch (type) {
      case 'mobile': return Smartphone
      case 'desktop': return Monitor
      case 'browser': return Globe
      case 'hardware': return Lock
      default: return Bitcoin
    }
  }

  const getDifficultyColor = (difficulty: WalletProvider['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPrivacyColor = (privacy: WalletProvider['privacyLevel']) => {
    switch (privacy) {
      case 'high': return 'bg-purple-100 text-purple-700'
      case 'medium': return 'bg-blue-100 text-blue-700'
      case 'low': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCustodyColor = (custody: WalletProvider['custody']) => {
    switch (custody) {
      case 'self-custody': return 'bg-green-100 text-green-700'
      case 'custodial': return 'bg-orange-100 text-orange-700'
      case 'hybrid': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Bitcoin className="w-8 h-8 text-bitcoinOrange" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bitcoin Wallet Discovery</h1>
                <p className="text-sm text-gray-600">Find the perfect wallet for your needs</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search wallets by name or features..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Wallet Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Type</label>
                    <div className="space-y-2">
                      {['mobile', 'desktop', 'browser', 'hardware'].map(type => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.type.includes(type)}
                            onChange={(e) => {
                              setFilters(prev => ({
                                ...prev,
                                type: e.target.checked
                                  ? [...prev.type, type]
                                  : prev.type.filter(t => t !== type)
                              }))
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                    <div className="space-y-2">
                      {['beginner', 'intermediate', 'advanced'].map(difficulty => (
                        <label key={difficulty} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.difficulty.includes(difficulty)}
                            onChange={(e) => {
                              setFilters(prev => ({
                                ...prev,
                                difficulty: e.target.checked
                                  ? [...prev.difficulty, difficulty]
                                  : prev.difficulty.filter(d => d !== difficulty)
                              }))
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{difficulty}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Privacy Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
                    <div className="space-y-2">
                      {['high', 'medium', 'low'].map(privacy => (
                        <label key={privacy} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.privacy.includes(privacy)}
                            onChange={(e) => {
                              setFilters(prev => ({
                                ...prev,
                                privacy: e.target.checked
                                  ? [...prev.privacy, privacy]
                                  : prev.privacy.filter(p => p !== privacy)
                              }))
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{privacy}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Custody Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Key Control</label>
                    <div className="space-y-2">
                      {['self-custody', 'custodial', 'hybrid'].map(custody => (
                        <label key={custody} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.custody.includes(custody)}
                            onChange={(e) => {
                              setFilters(prev => ({
                                ...prev,
                                custody: e.target.checked
                                  ? [...prev.custody, custody]
                                  : prev.custody.filter(c => c !== custody)
                              }))
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{custody.replace('-', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              {filteredWallets.length} wallet{filteredWallets.length !== 1 ? 's' : ''} found
            </p>
            <Button
              variant="outline"
              onClick={() => setFilters({
                type: [],
                difficulty: [],
                privacy: [],
                custody: [],
                countries: [],
                features: [],
                search: ''
              })}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWallets.map((wallet, index) => {
            const TypeIcon = getTypeIcon(wallet.type)

            return (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="cursor-pointer"
                onClick={() => setSelectedWallet(wallet)}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 border-2 hover:border-bitcoinOrange/50">
                  <div className="p-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-bitcoinOrange/10 rounded-lg">
                          <TypeIcon className="w-5 h-5 text-bitcoinOrange" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{wallet.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getDifficultyColor(wallet.difficulty)}>
                              {wallet.difficulty}
                            </Badge>
                            {wallet.recommended && (
                              <Badge className="bg-green-100 text-green-700">
                                <Star className="w-3 h-3 mr-1" />
                                Recommended
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pt-0">
                    <p className="text-gray-600 text-sm mb-4">{wallet.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={getPrivacyColor(wallet.privacyLevel)}>
                        {wallet.privacyLevel} privacy
                      </Badge>
                      <Badge className={getCustodyColor(wallet.custody)}>
                        {wallet.custody}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Setup: {wallet.setupTime}min</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{wallet.rating}</span>
                        <span>({wallet.reviewCount})</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Selected Wallet Details Modal */}
        <AnimatePresence>
          {selectedWallet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedWallet(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-bitcoinOrange/10 rounded-xl">
                        {React.createElement(getTypeIcon(selectedWallet.type), {
                          className: "w-8 h-8 text-bitcoinOrange"
                        })}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedWallet.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getDifficultyColor(selectedWallet.difficulty)}>
                            {selectedWallet.difficulty}
                          </Badge>
                          <Badge className={getPrivacyColor(selectedWallet.privacyLevel)}>
                            {selectedWallet.privacyLevel} privacy
                          </Badge>
                          <Badge className={getCustodyColor(selectedWallet.custody)}>
                            {selectedWallet.custody}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedWallet(null)}>
                      <EyeOff className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">About</h3>
                        <p className="text-gray-600">{selectedWallet.longDescription}</p>
                      </div>

                      {/* Features */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Features
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedWallet.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Security Features */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-500" />
                          Security Features
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedWallet.securityFeatures.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Pros & Cons */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            Advantages
                          </h3>
                          <ul className="space-y-2">
                            {selectedWallet.pros.map((pro, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-600">
                            <AlertTriangle className="w-5 h-5" />
                            Considerations
                          </h3>
                          <ul className="space-y-2">
                            {selectedWallet.cons.map((con, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Setup time: {selectedWallet.setupTime} minutes</span>
                          <span>Platforms: {selectedWallet.supportedPlatforms.join(', ')}</span>
                        </div>

                        <Button
                          onClick={() => window.open(selectedWallet.downloadUrl, '_blank')}
                          className="w-full bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Get {selectedWallet.name}
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {filteredWallets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Bitcoin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No wallets found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
            <Button
              variant="outline"
              onClick={() => setFilters({
                type: [],
                difficulty: [],
                privacy: [],
                custody: [],
                countries: [],
                features: [],
                search: ''
              })}
            >
              Clear All Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
