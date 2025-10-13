'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bitcoin,
  Smartphone,
  Monitor,
  Globe,
  Lock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  ExternalLink,
  Copy,
  QrCode,
  Shield,
  AlertTriangle,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/Progress'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: any
  content: any
  action?: {
    label: string
    onClick: () => void
  }
}

export default function WalletOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState('')

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Bitcoin Wallets',
      description: 'Let\'s get you set up with a secure Bitcoin wallet',
      icon: Bitcoin,
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-bitcoinOrange/10 rounded-full flex items-center justify-center mx-auto">
            <Bitcoin className="w-10 h-10 text-bitcoinOrange" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Why do you need a Bitcoin wallet?</h3>
            <p className="text-gray-600">
              A Bitcoin wallet lets you receive, store, and send Bitcoin. It's like a digital bank account
              that you control completely - no bank can freeze your funds or charge you fees.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="font-semibold text-blue-900 mb-1">Pro Tip</h4>
                <p className="text-blue-800 text-sm">
                  Your wallet is yours alone. Never share your recovery phrase with anyone, and always
                  download wallets from official websites.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'choose-type',
      title: 'Choose Your Wallet Type',
      description: 'Different wallets work better for different needs',
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedWallet === 'mobile' ? 'ring-2 ring-bitcoinOrange border-bitcoinOrange' : ''
              }`}
              onClick={() => setSelectedWallet('mobile')}
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Mobile Wallet</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Perfect for everyday use, payments, and portability
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Great for beginners</span>
                </div>
              </div>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedWallet === 'desktop' ? 'ring-2 ring-bitcoinOrange border-bitcoinOrange' : ''
              }`}
              onClick={() => setSelectedWallet('desktop')}
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Monitor className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Desktop Wallet</h3>
                <p className="text-sm text-gray-600 mb-3">
                  More features, better security, ideal for regular users
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Advanced features</span>
                </div>
              </div>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedWallet === 'hardware' ? 'ring-2 ring-bitcoinOrange border-bitcoinOrange' : ''
              }`}
              onClick={() => setSelectedWallet('hardware')}
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Hardware Wallet</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Maximum security for large amounts, requires physical device
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Military-grade security</span>
                </div>
              </div>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedWallet === 'browser' ? 'ring-2 ring-bitcoinOrange border-bitcoinOrange' : ''
              }`}
              onClick={() => setSelectedWallet('browser')}
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Browser Wallet</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Built into your browser, convenient for web3 applications
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Web3 ready</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'get-wallet',
      title: 'Get Your Wallet',
      description: 'Download and install your chosen wallet',
      icon: Download,
      content: (
        <div className="space-y-6">
          {selectedWallet && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-bitcoinOrange/10 rounded-lg flex items-center justify-center">
                  {selectedWallet === 'mobile' && <Smartphone className="w-6 h-6 text-bitcoinOrange" />}
                  {selectedWallet === 'desktop' && <Monitor className="w-6 h-6 text-bitcoinOrange" />}
                  {selectedWallet === 'hardware' && <Lock className="w-6 h-6 text-bitcoinOrange" />}
                  {selectedWallet === 'browser' && <Globe className="w-6 h-6 text-bitcoinOrange" />}
                </div>
                <div>
                  <h3 className="font-semibold capitalize">{selectedWallet} Wallet Selected</h3>
                  <p className="text-sm text-gray-600">
                    {selectedWallet === 'mobile' && 'Perfect for on-the-go Bitcoin use'}
                    {selectedWallet === 'desktop' && 'Great for regular computer use'}
                    {selectedWallet === 'hardware' && 'Maximum security for your Bitcoin'}
                    {selectedWallet === 'browser' && 'Convenient for web applications'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-800">
                    Download from official website only
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Verify the URL and check for HTTPS
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Never download wallets from third-party sites
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <Button className="bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white">
              <Download className="w-4 h-4 mr-2" />
              Download Official Wallet
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'setup-wallet',
      title: 'Set Up Your Wallet',
      description: 'Create your wallet and save your recovery phrase',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Critical Security Step</h3>
                <p className="text-red-800 text-sm mb-3">
                  Your recovery phrase (seed phrase) is the master key to your Bitcoin.
                  Write it down on paper and store it safely offline.
                </p>
                <div className="bg-red-100 border border-red-300 rounded p-3">
                  <p className="text-red-900 text-sm font-medium">
                    🚨 NEVER share your recovery phrase with anyone. Never store it digitally.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Download & Install</h4>
              <p className="text-sm text-gray-600">
                Follow the official installation guide
              </p>
            </Card>

            <Card className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Create Wallet</h4>
              <p className="text-sm text-gray-600">
                Generate your recovery phrase
              </p>
            </Card>

            <Card className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">Verify Backup</h4>
              <p className="text-sm text-gray-600">
                Confirm your recovery phrase
              </p>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'get-address',
      title: 'Get Your Bitcoin Address',
      description: 'Copy your receiving address to use on OrangeCat',
      icon: Copy,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <QrCode className="w-16 h-16 text-bitcoinOrange mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your Bitcoin Address</h3>
            <p className="text-gray-600 mb-6">
              This is your unique Bitcoin address. People can send Bitcoin to this address.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <code className="flex-1 font-mono text-sm bg-white p-3 rounded border">
                bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
              </code>
              <Button variant="outline" size="sm">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Pro Tip</span>
              </div>
              <p className="text-blue-800 text-sm">
                You can generate a new address for each donation to improve privacy.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-900">Next Step</span>
              </div>
              <p className="text-green-800 text-sm">
                Add this address to your OrangeCat profile to start receiving donations.
              </p>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Add to OrangeCat Profile',
        onClick: () => {
          // This would navigate to profile setup
        }
      }
    }
  ]

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Bitcoin className="w-8 h-8 text-bitcoinOrange" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Get Your Bitcoin Wallet</h1>
                <p className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>
              Skip for Now
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {currentStepData.title}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Step Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-bitcoinOrange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <currentStepData.icon className="w-8 h-8 text-bitcoinOrange" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {currentStepData.content}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStepData.action ? (
                <Button
                  onClick={currentStepData.action.onClick}
                  className="bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white"
                >
                  {currentStepData.action.label}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  disabled={currentStep === steps.length - 1}
                  className="bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
