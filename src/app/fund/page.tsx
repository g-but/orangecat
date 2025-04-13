'use client'

import { motion } from 'framer-motion'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { WalletSection } from '@/components/profile/WalletSection'
import { BalanceCard } from '@/components/bitcoin/BalanceCard'
import { TransactionsList } from '@/components/bitcoin/TransactionsList'
import { TransparencyScore } from '@/components/transparency/TransparencyScore'
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet'
import { TRANSPARENCY_METRICS, calculateTransparencyScore } from '@/lib/transparency'

// Static profile data
const PROFILE_DATA = {
  name: 'OrangCat',
  description: 'A transparent and trustworthy platform for funding innovative projects',
  metrics: [
    {
      id: 'openSource',
      name: 'Open Source Code',
      description: 'Project code is publicly available and verifiable',
      weight: 0.5,
      enabled: true
    },
    {
      id: 'publicBalance',
      name: 'Public Balance',
      description: 'Current balance is publicly visible',
      weight: 0.1,
      enabled: true
    },
    {
      id: 'publicTransactions',
      name: 'Public Transactions',
      description: 'Transaction history is publicly visible',
      weight: 0.1,
      enabled: true
    },
    {
      id: 'activityLog',
      name: 'Activity Logging',
      description: 'Project activities are logged and visible',
      weight: 0.1,
      enabled: false
    },
    {
      id: 'screenRecording',
      name: 'Screen Recording',
      description: 'Project activities are screen recorded',
      weight: 0.1,
      enabled: false
    }
  ]
}

export default function FundPage() {
  const walletAddress = process.env.NEXT_PUBLIC_BITCOIN_ADDRESS || ''
  const { walletData, isLoading, error, refresh } = useBitcoinWallet(walletAddress)

  const { score, color, description } = calculateTransparencyScore(PROFILE_DATA.metrics)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <div className="mb-12">
          <ProfileHeader
            name={PROFILE_DATA.name}
            description={PROFILE_DATA.description}
            transparencyScore={score}
            transparencyColor={color}
          />
        </div>

        {/* Why Fund Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Fund Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Transparency</h3>
              <p className="text-gray-600">
                Every transaction is verifiable on the blockchain. Our {score}% transparency score reflects our commitment to open financial practices.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Innovation</h3>
              <p className="text-gray-600">
                We're building the infrastructure for the future of Bitcoin funding, making it accessible and efficient for everyone.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Impact</h3>
              <p className="text-gray-600">
                Your funding directly supports the development of tools that empower individuals and organizations in the Bitcoin ecosystem.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Funding Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Wallet Addresses and Transparency Score */}
          <div className="space-y-8">
            <WalletSection
              walletAddress={walletAddress}
              lightningAddress={process.env.NEXT_PUBLIC_LIGHTNING_ADDRESS}
            />
            <TransparencyScore
              metrics={PROFILE_DATA.metrics}
            />
          </div>

          {/* Right Column: Balance and Transactions */}
          <div className="space-y-8">
            <div className="text-3xl font-bold text-tiffany">
              {isLoading ? (
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
              ) : (
                `${(walletData?.balance || 0).toFixed(4)} BTC`
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
              <TransactionsList
                transactions={walletData?.transactions || []}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 