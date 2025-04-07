'use client'

import { motion } from 'framer-motion'
import { Bitcoin, Copy, Check, ExternalLink, Zap } from 'lucide-react'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { BalanceCard } from '@/components/bitcoin/BalanceCard'
import { TransactionsList } from '@/components/bitcoin/TransactionsList'
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet'

interface WalletSectionProps {
  walletAddress: string
  lightningAddress?: string
}

export function WalletSection({ walletAddress, lightningAddress }: WalletSectionProps) {
  const [copied, setCopied] = useState<'bitcoin' | 'lightning' | null>(null)
  const [activeTab, setActiveTab] = useState<'bitcoin' | 'lightning'>('bitcoin')
  const { walletData, isLoading, error } = useBitcoinWallet(walletAddress)

  // Extract the clean address from URI if needed
  const displayAddress = activeTab === 'bitcoin'
    ? walletAddress.startsWith('bitcoin:') 
      ? walletAddress.split('?')[0].replace('bitcoin:', '')
      : walletAddress
    : lightningAddress;

  const copyToClipboard = async (type: 'bitcoin' | 'lightning') => {
    try {
      // Copy just the address for Bitcoin, full invoice for Lightning
      const text = type === 'bitcoin' ? displayAddress : lightningAddress
      await navigator.clipboard.writeText(text || '')
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const refreshWalletData = () => {
    window.location.reload()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="card mb-6"
      >
        <div className="flex justify-center mb-6 space-x-4">
          <button
            onClick={() => setActiveTab('bitcoin')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'bitcoin' ? 'bg-tiffany/10 text-tiffany' : 'text-slate-500'
            }`}
          >
            <Bitcoin className="w-5 h-5 mr-2" />
            Bitcoin
          </button>
          {lightningAddress && (
            <button
              onClick={() => setActiveTab('lightning')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'lightning' ? 'bg-yellow-100 text-yellow-600' : 'text-slate-500'
              }`}
            >
              <Zap className="w-5 h-5 mr-2" />
              Lightning
            </button>
          )}
        </div>

        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">
              {activeTab === 'bitcoin' ? 'Bitcoin Address' : 'Lightning Invoice'}
            </h3>
            <div className="flex items-center justify-center space-x-2">
              <code className="text-sm bg-slate-100 px-3 py-2 rounded-lg font-mono break-all">
                {activeTab === 'bitcoin' ? displayAddress : lightningAddress}
              </code>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(activeTab)}
                  className="p-2 text-slate-400 hover:text-tiffany transition-colors"
                  aria-label={`Copy ${activeTab} address`}
                >
                  {copied === activeTab ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                {activeTab === 'bitcoin' && (
                  <a
                    href={`https://mempool.space/address/${displayAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-tiffany transition-colors"
                    aria-label="View on block explorer"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Scan QR Code</h3>
            <div className="bg-white p-4 rounded-xl inline-block shadow-sm">
              <QRCodeSVG
                value={activeTab === 'bitcoin' ? walletAddress : lightningAddress || ''}
                size={192}
                level="H"
                includeMargin={true}
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="text-center text-slate-600">
            <p>Thank you for supporting our mission!</p>
            <p className="text-sm mt-2">
              {activeTab === 'bitcoin' ? 
                'Click the QR code to open in your Bitcoin wallet' :
                'Scan with your Lightning wallet'
              }
            </p>
          </div>
        </div>
      </motion.div>

      {activeTab === 'bitcoin' && (
        <>
          {error && (
            <div className="bg-red-50 p-4 rounded-lg mb-6 text-red-700 text-center">
              <p>{error}</p>
            </div>
          )}
          
          {walletData && (
            <BalanceCard
              balance={walletData.balance}
              lastUpdated={walletData.lastUpdated}
              isLoading={isLoading}
              onRefresh={refreshWalletData}
            />
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Recent Transactions</h2>
            {walletData ? (
              <TransactionsList
                transactions={walletData.transactions}
                isLoading={isLoading}
              />
            ) : !error && (
              <div className="space-y-4 mt-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="card animate-pulse">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-200 mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                        <div className="h-3 w-16 bg-slate-200 rounded"></div>
                      </div>
                      <div className="h-4 w-20 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </>
  )
} 