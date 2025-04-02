'use client'

import { motion } from 'framer-motion'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { WalletSection } from '@/components/profile/WalletSection'
import { TransactionLedger } from '@/components/profile/TransactionLedger'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { AlertTriangle } from 'lucide-react'

// Static example data
const PROFILE_DATA = {
  name: 'Palfare',
  description: 'Building the simplest way to accept Bitcoin donations. Join us in making Bitcoin accessible to everyone.',
  trustScore: 95,
  transparencyScore: 90,
  walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  transactions: [
    {
      id: '1',
      amount: 0.01,
      timestamp: '2024-04-02T12:00:00Z',
      type: 'incoming' as const,
      explanation: 'Thank you for supporting our mission! This donation will help us improve our platform and add new features.',
      likes: 5,
      dislikes: 0,
      comments: [
        { id: '1', author: 'BitcoinEnthusiast', text: 'Great project! Love the transparency.', timestamp: '2024-04-02T12:05:00Z' },
        { id: '2', author: 'CryptoSupporter', text: 'Keep up the good work!', timestamp: '2024-04-02T12:10:00Z' }
      ]
    },
    {
      id: '2',
      amount: 0.05,
      timestamp: '2024-04-01T15:30:00Z',
      type: 'incoming' as const,
      explanation: 'Donation from a community member who believes in our vision.',
      likes: 3,
      dislikes: 0,
      comments: [
        { id: '3', author: 'BitcoinMaxi', text: 'This is exactly what Bitcoin needs!', timestamp: '2024-04-01T15:35:00Z' }
      ]
    },
    {
      id: '3',
      amount: 0.02,
      timestamp: '2024-03-30T09:15:00Z',
      type: 'outgoing' as const,
      explanation: 'Payment for server hosting to keep our platform running smoothly.',
      likes: 2,
      dislikes: 0,
      comments: []
    }
  ]
}

export default function DonatePage() {
  return (
    <main className="min-h-screen pt-20 bg-gradient-to-b from-white to-slate-50">
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="container py-4">
          <div className="flex items-center justify-center gap-2 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">
              <span className="font-bold">DEMONSTRATION ONLY:</span> This is a preview of our donation platform. The Bitcoin address shown is not real. Please do not send any funds. Coming soon!
            </p>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <ProfileHeader 
              name={PROFILE_DATA.name}
              description={PROFILE_DATA.description}
            />
            
            <ProfileStats 
              trustScore={PROFILE_DATA.trustScore}
              transparencyScore={PROFILE_DATA.transparencyScore}
            />

            <WalletSection 
              walletAddress={PROFILE_DATA.walletAddress}
            />

            <TransactionLedger 
              transactions={PROFILE_DATA.transactions}
            />
          </motion.div>
        </div>
      </section>
    </main>
  )
} 