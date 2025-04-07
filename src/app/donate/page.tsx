'use client'

import { motion } from 'framer-motion'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { WalletSection } from '@/components/profile/WalletSection'
import { TransactionLedger } from '@/components/profile/TransactionLedger'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

// Validate Bitcoin address format
const isValidBitcoinAddress = (address: string): boolean => {
  // Basic validation - can be enhanced with more specific checks
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || 
         /^bc1[ac-hj-np-z02-9]{11,71}$/.test(address)
}

// Static example data
const PROFILE_DATA = {
  name: 'Palfare',
  description: 'Building the simplest way to accept Bitcoin donations. Join us in making Bitcoin accessible to everyone.',
  trustScore: 95,
  transparencyScore: 90,
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
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean>(false)

  useEffect(() => {
    const address = process.env.NEXT_PUBLIC_BITCOIN_ADDRESS
    if (address) {
      setWalletAddress(address)
      setIsValid(isValidBitcoinAddress(address))
    }
  }, [])

  return (
    <main className="min-h-screen pt-20 bg-gradient-to-b from-white to-slate-50">
      {!isValid && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="container py-4">
            <div className="flex items-center justify-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm font-medium">
                <span className="font-bold">WARNING:</span> Invalid Bitcoin address configured. Please check your environment variables.
              </p>
            </div>
          </div>
        </div>
      )}

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

            {isValid && (
              <WalletSection 
                walletAddress={walletAddress}
              />
            )}

            <TransactionLedger 
              transactions={PROFILE_DATA.transactions}
            />
          </motion.div>
        </div>
      </section>
    </main>
  )
} 