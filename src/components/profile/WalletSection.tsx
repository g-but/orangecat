'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Bitcoin, Zap } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface WalletSectionProps {
  walletAddress: string
  lightningAddress?: string
}

export function WalletSection({ walletAddress, lightningAddress }: WalletSectionProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'bitcoin' | 'lightning'>('bitcoin')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h3 className="text-lg font-medium text-gray-900 mb-4">Funding Options</h3>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('bitcoin')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'bitcoin'
              ? 'bg-orange-100 text-orange-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Bitcoin className="h-5 w-5" />
          <span>Bitcoin</span>
        </button>
        {lightningAddress && (
          <button
            onClick={() => setActiveTab('lightning')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'lightning'
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Zap className="h-5 w-5" />
            <span>Lightning</span>
          </button>
        )}
      </div>

      {/* Bitcoin Tab Content */}
      {activeTab === 'bitcoin' && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your Bitcoin wallet to send funding
            </p>
            <div className="flex justify-center p-4 bg-white rounded-lg border border-gray-200">
              <QRCodeSVG
                value={`bitcoin:${walletAddress}`}
                size={200}
                className="rounded-lg"
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Or copy the address below</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={walletAddress}
                readOnly
                className="flex-1 p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={handleCopy}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Copy address"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightning Tab Content */}
      {activeTab === 'lightning' && lightningAddress && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your Lightning wallet to send funding
            </p>
            <div className="flex justify-center p-4 bg-white rounded-lg border border-gray-200">
              <QRCodeSVG
                value={`lightning:${lightningAddress}`}
                size={200}
                className="rounded-lg"
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Or copy the address below</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={lightningAddress}
                readOnly
                className="flex-1 p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={() => navigator.clipboard.writeText(lightningAddress)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Copy address"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
} 