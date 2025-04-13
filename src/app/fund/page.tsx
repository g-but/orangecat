'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Bitcoin, Zap } from 'lucide-react'
import { TransparencyScore } from '@/components/transparency/TransparencyScore'
import { calculateTransparencyScore, TRANSPARENCY_METRICS } from '@/lib/transparency'
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet'

export default function FundPage() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'bitcoin' | 'lightning'>('bitcoin')
  const walletAddress = process.env.NEXT_PUBLIC_BITCOIN_ADDRESS || ''
  const { walletData, isLoading, error, refresh } = useBitcoinWallet(walletAddress)

  const bitcoinAddress = walletAddress
  const lightningAddress = process.env.NEXT_PUBLIC_LIGHTNING_ADDRESS || ''

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const transparencyData = {
    transactionCount: walletData?.transactions?.length || 0,
    hasPublicBalance: true,
    verificationLevel: 100,
    activityLogCount: 10,
    isCodePublic: true
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-orange-500">OC</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orange Cat</h1>
              <p className="text-gray-600">Supporting open-source development</p>
            </div>
          </div>
        </motion.div>

        {/* Why Fund Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Why Fund Us</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              Your support helps us maintain and improve our open-source projects. We believe in transparency and community-driven development.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>100% of funds go towards development and maintenance</li>
              <li>Regular updates and progress reports</li>
              <li>Community-driven feature prioritization</li>
              <li>Transparent financial reporting</li>
            </ul>
          </div>
        </motion.div>

        {/* Funding Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Funding Options</h2>
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('bitcoin')}
                  className={`${
                    activeTab === 'bitcoin'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Bitcoin className="h-5 w-5" />
                  <span>Bitcoin</span>
                </button>
                <button
                  onClick={() => setActiveTab('lightning')}
                  className={`${
                    activeTab === 'lightning'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Zap className="h-5 w-5" />
                  <span>Lightning</span>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="pt-4">
              {activeTab === 'bitcoin' ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <QRCodeSVG value={`bitcoin:${bitcoinAddress}`} size={200} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
                      {bitcoinAddress}
                    </code>
                    <button
                      onClick={() => handleCopy(bitcoinAddress)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <QRCodeSVG value={`lightning:${lightningAddress}`} size={200} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
                      {lightningAddress}
                    </code>
                    <button
                      onClick={() => handleCopy(lightningAddress)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Finances */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Finances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Balance Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Current Balance</h3>
              {isLoading ? (
                <div className="h-12 w-48 bg-orange-200 rounded animate-pulse" />
              ) : (
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold text-orange-600">
                    {(walletData?.balance || 0).toFixed(4)}
                  </p>
                  <span className="text-lg font-medium text-orange-500">BTC</span>
                </div>
              )}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">Last updated</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Recent Transactions Card */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                <button
                  onClick={refresh}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Refresh
                </button>
              </div>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : walletData?.transactions?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {walletData?.transactions?.slice(0, 5).map((tx, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.type === 'incoming'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {tx.type === 'incoming' ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tx.type === 'incoming' ? 'Received' : 'Sent'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            tx.type === 'incoming' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'incoming' ? '+' : '-'}
                          {Math.abs(tx.value).toFixed(4)} BTC
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            tx.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Transparency Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TransparencyScore data={transparencyData} />
        </motion.div>
      </div>
    </div>
  )
} 