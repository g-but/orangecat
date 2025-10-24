'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Bitcoin, 
  Smartphone, 
  Monitor, 
  Shield, 
  CheckCircle, 
  ExternalLink, 
  ArrowLeft,
  Download,
  Globe,
  Zap,
  Lock,
  Star,
  ChevronRight,
  AlertTriangle
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { BitcoinBadge } from '@/components/ui/BitcoinBadge'
import { componentColors, getColorClasses } from '@/lib/theme'

interface WalletOption {
  id: string
  name: string
  type: 'mobile' | 'desktop' | 'browser' | 'hardware'
  description: string
  pros: string[]
  cons: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  logoUrl?: string
  downloadUrl: string
  supportedPlatforms: string[]
  features: string[]
  recommended?: boolean
}

const walletOptions: WalletOption[] = [
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
      'Easy to use interface'
    ],
    cons: [
      'Only available in Brave browser',
      'Relatively new compared to other wallets'
    ],
    difficulty: 'beginner',
    downloadUrl: 'https://brave.com/',
    supportedPlatforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
    features: ['Self-custody', 'Multi-chain', 'Browser integrated', 'Open source'],
    recommended: true
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
      'Watch-only wallet support'
    ],
    cons: [
      'Mobile only',
      'May be complex for absolute beginners'
    ],
    difficulty: 'beginner',
    downloadUrl: 'https://bluewallet.io/',
    supportedPlatforms: ['iOS', 'Android'],
    features: ['Bitcoin-only', 'Lightning Network', 'Open source', 'Watch-only wallets']
  },
  {
    id: 'exodus',
    name: 'Exodus',
    type: 'desktop',
    description: 'User-friendly desktop wallet with beautiful design and multi-cryptocurrency support.',
    pros: [
      'Beautiful, intuitive interface',
      'Built-in exchange features',
      'Multi-cryptocurrency support',
      'Good customer support',
      'Portfolio tracking'
    ],
    cons: [
      'Not open source',
      'Higher fees for built-in exchange',
      'Less privacy-focused'
    ],
    difficulty: 'beginner',
    downloadUrl: 'https://www.exodus.com/',
    supportedPlatforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
    features: ['Multi-crypto', 'Built-in exchange', 'Portfolio tracking', 'Mobile & desktop']
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
      'Hardware wallet support'
    ],
    cons: [
      'Interface can be intimidating for beginners',
      'No built-in exchange',
      'Requires more technical knowledge'
    ],
    difficulty: 'intermediate',
    downloadUrl: 'https://electrum.org/',
    supportedPlatforms: ['Windows', 'macOS', 'Linux', 'Android'],
    features: ['Bitcoin-only', 'Lightweight', 'Hardware wallet support', 'Advanced features']
  }
]

const steps = [
  {
    title: 'Choose Your Wallet Type',
    description: 'Different wallets work better for different needs and experience levels.',
    icon: Bitcoin
  },
  {
    title: 'Download & Install',
    description: 'Get your chosen wallet from the official website or app store.',
    icon: Download
  },
  {
    title: 'Create Your Wallet',
    description: 'Follow the setup process and securely save your recovery phrase.',
    icon: Shield
  },
  {
    title: 'Get Your Address',
    description: 'Copy your Bitcoin receiving address to use on OrangeCat.',
    icon: CheckCircle
  }
]

export default function BitcoinWalletGuidePage() {
  const [selectedWallet, setSelectedWallet] = useState<string>('brave')
  const [currentStep, setCurrentStep] = useState(0)

  const selectedWalletData = walletOptions.find(w => w.id === selectedWallet)

  const getTypeIcon = (type: WalletOption['type']) => {
    switch (type) {
      case 'mobile': return Smartphone
      case 'desktop': return Monitor
      case 'browser': return Globe
      case 'hardware': return Lock
      default: return Bitcoin
    }
  }

  const getDifficultyColor = (difficulty: WalletOption['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50 border-green-200'
      case 'intermediate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'advanced': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to OrangeCat
            </Link>
            <BitcoinBadge variant="outline">
              Bitcoin Wallet Guide
            </BitcoinBadge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className={`inline-flex items-center gap-3 p-4 rounded-2xl mb-6 ${componentColors.bitcoinElement.className}`}>
            <Bitcoin className="w-12 h-12" />
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Get Your Bitcoin Wallet
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Start receiving Bitcoin donations on OrangeCat
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 mb-1">New to Bitcoin?</h3>
                <p className="text-blue-800 text-sm">
                  A Bitcoin wallet is like a digital bank account that lets you receive, store, and send Bitcoin. 
                  You control your wallet completely - no bank or company can freeze your funds.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How to Get Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`text-center p-6 rounded-xl border-2 transition-all cursor-pointer ${
                    isActive 
                      ? componentColors.bitcoinElement.className + ' border-bitcoinOrange shadow-lg'
                      : isCompleted
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    isActive 
                      ? 'bg-bitcoinOrange text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wallet Options */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Choose Your Wallet
            </h2>
            
            <div className="space-y-4">
              {walletOptions.map((wallet) => {
                const TypeIcon = getTypeIcon(wallet.type)
                const isSelected = selectedWallet === wallet.id

                return (
                  <motion.div
                    key={wallet.id}
                    layout
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 ring-bitcoinOrange border-bitcoinOrange shadow-lg' 
                          : 'hover:shadow-md border-gray-200'
                      } ${wallet.recommended ? 'ring-1 ring-green-200 bg-green-50/30' : ''}`}
                      onClick={() => setSelectedWallet(wallet.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? componentColors.bitcoinElement.className : 'bg-gray-100'
                            }`}>
                              <TypeIcon className={`w-5 h-5 ${
                                isSelected ? 'text-bitcoinOrange' : 'text-gray-600'
                              }`} />
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
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(wallet.difficulty)}`}>
                                {wallet.difficulty.charAt(0).toUpperCase() + wallet.difficulty.slice(1)}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 transition-transform ${
                            isSelected ? 'rotate-90 text-bitcoinOrange' : 'text-gray-400'
                          }`} />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <CardDescription className="mb-4">
                          {wallet.description}
                        </CardDescription>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {wallet.features.map((feature) => (
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
                )
              })}
            </div>
          </div>

          {/* Selected Wallet Details */}
          <div className="lg:col-span-1">
            {selectedWalletData && (
              <motion.div
                key={selectedWallet}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-8"
              >
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bitcoin className="w-5 h-5 text-bitcoinOrange" />
                      {selectedWalletData.name}
                    </CardTitle>
                    <CardDescription>
                      Detailed information and setup guide
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Pros & Cons */}
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Advantages
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {selectedWalletData.pros.map((pro, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Considerations
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {selectedWalletData.cons.map((con, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Download Button */}
                    <Button
                      onClick={() => window.open(selectedWalletData.downloadUrl, '_blank')}
                      className="w-full bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Get {selectedWalletData.name}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>

                    {/* Security Note */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <strong className="text-red-800">Security Tip:</strong>
                          <p className="text-red-700 mt-1">
                            Always download wallets from official websites. Save your recovery phrase in a safe place - it&apos;s the only way to recover your Bitcoin if you lose access to your wallet.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is it safe to use a Bitcoin wallet?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Yes, when used properly. Bitcoin wallets use strong cryptography. The key is to choose a reputable wallet, 
                  keep your recovery phrase secure, and never share your private keys with anyone.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do I need to pay to create a wallet?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  No, creating a Bitcoin wallet is free. You only pay network fees when sending Bitcoin transactions. 
                  Receiving Bitcoin is always free.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What if I lose my recovery phrase?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  If you lose your recovery phrase and can&apos;t access your wallet, your Bitcoin will be permanently lost. 
                  This is why it&apos;s crucial to write it down and store it safely offline.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I use the same address multiple times?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Yes, you can reuse Bitcoin addresses, but it&apos;s better for privacy to generate a new address for each 
                  transaction. Most modern wallets do this automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Card className={`max-w-2xl mx-auto ${componentColors.bitcoinElement.className} border-bitcoinOrange/30`}>
            <CardContent className="p-8">
              <Bitcoin className="w-16 h-16 text-bitcoinOrange mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-gray-600 mb-6">
                Once you have your Bitcoin wallet set up, you can add your Bitcoin address to your OrangeCat profile 
                and start receiving donations for your projects and projects.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => setCurrentStep(1)}
                  className="bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Get a Wallet Now
                </Button>
                <Link href="/profile/setup">
                  <Button
                    variant="outline"
                    className="border-bitcoinOrange text-bitcoinOrange hover:bg-bitcoinOrange/10"
                  >
                    <Bitcoin className="w-4 h-4 mr-2" />
                    Complete Profile Setup
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}