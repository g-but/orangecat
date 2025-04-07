'use client'

import { motion } from 'framer-motion'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { WalletSection } from '@/components/profile/WalletSection'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

// Validate Bitcoin address format
const isValidBitcoinAddress = (address: string): boolean => {
  // Extract address from URI if needed
  let cleanAddress = address
  if (address.startsWith('bitcoin:')) {
    cleanAddress = address.split('?')[0].replace('bitcoin:', '')
  }
  
  // Enhanced validation including Taproot addresses
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(cleanAddress) || 
         /^bc1[ac-hj-np-z02-9]{11,71}$/.test(cleanAddress) ||
         /^bc1p[a-zA-Z0-9]{58,103}$/.test(cleanAddress) // Added Taproot support
}

// Static example data
const PROFILE_DATA = {
  name: 'Palfare',
  description: 'Building the simplest way to accept Bitcoin donations. Join us in making Bitcoin accessible to everyone.',
  transparencyScore: 100
}

export default function DonatePage() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [lightningAddress, setLightningAddress] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean>(false)

  useEffect(() => {
    const address = process.env.NEXT_PUBLIC_BITCOIN_ADDRESS
    const lightning = process.env.NEXT_PUBLIC_LIGHTNING_ADDRESS
    if (address) {
      setWalletAddress(address)
      setIsValid(isValidBitcoinAddress(address))
    }
    if (lightning) {
      setLightningAddress(lightning)
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
              transparencyScore={PROFILE_DATA.transparencyScore}
            />

            {isValid && (
              <WalletSection 
                walletAddress={walletAddress}
                lightningAddress={lightningAddress}
              />
            )}
          </motion.div>
        </div>
      </section>
    </main>
  )
} 