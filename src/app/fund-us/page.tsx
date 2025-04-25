'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Bitcoin, Zap, Info } from 'lucide-react'
import { TransparencyScore } from '@/components/transparency/TransparencyScore'
import { calculateTransparencyScore, TRANSPARENCY_METRICS } from '@/lib/transparency'
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet'
import { useAuth } from '@/contexts/AuthContext'
import { createBrowserClient } from '@supabase/ssr'

export default function FundUsPage() {
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')
  const { user } = useAuth()

  const walletAddress = 'bc1qgsup75ajy4rln08j0te9wpdgrf46ctx6w94xzq'
  const { walletData, isLoading, error, refresh } = useBitcoinWallet(walletAddress)

  const bitcoinAddress = walletAddress

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const transparencyData = {
    isOpenSource: true,
    hasContributionGuidelines: true,
    hasIssueTracking: true,
    hasMissionStatement: true,
    hasKPIs: true,
    hasProgressUpdates: true,
    hasTransactionHistory: true,
    hasTransactionComments: true,
    hasFinancialReports: true,
    hasPublicChannels: true,
    hasCommunityUpdates: true,
    isResponsiveToFeedback: true
  }

  const transparencyScore = calculateTransparencyScore(TRANSPARENCY_METRICS, transparencyData)

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error('Supabase environment variables are not set')
        }

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

        console.log('Loading wallet data for address:', walletAddress)
        const { data, error } = await supabase
          .from('wallet_data')
          .select('*')
          .eq('address', walletAddress)
          .single()

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        console.log('Loaded wallet data:', data)
      } catch (err) {
        console.error('Error loading wallet data:', err)
      }
    }

    loadWalletData()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['fund', 'why-support', 'mission', 'financial', 'transparency', 'projects']
      const scrollPosition = window.scrollY + 100 // Add some offset to account for header

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Navigation */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <a 
              href="#fund" 
              className={`group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                activeSection === 'fund' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
              }`}
              onClick={() => setActiveSection('fund')}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="absolute left-0 w-1 h-6 bg-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </a>
            <a 
              href="#why-support" 
              className={`group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                activeSection === 'why-support' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
              }`}
              onClick={() => setActiveSection('why-support')}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="absolute left-0 w-1 h-6 bg-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </a>
            <a 
              href="#mission" 
              className={`group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                activeSection === 'mission' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
              }`}
              onClick={() => setActiveSection('mission')}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="absolute left-0 w-1 h-6 bg-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </a>
            <a 
              href="#financial" 
              className={`group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                activeSection === 'financial' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
              }`}
              onClick={() => setActiveSection('financial')}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="absolute left-0 w-1 h-6 bg-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </a>
            <a 
              href="#transparency" 
              className={`group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                activeSection === 'transparency' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
              }`}
              onClick={() => setActiveSection('transparency')}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="absolute left-0 w-1 h-6 bg-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </a>
            <a 
              href="#projects" 
              className={`group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                activeSection === 'projects' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
              }`}
              onClick={() => setActiveSection('projects')}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="absolute left-0 w-1 h-6 bg-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-inner">
                  <span className="text-2xl font-bold text-orange-600">OC</span>
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <a 
                    href="#transparency" 
                    className={`flex items-center justify-center h-6 w-6 rounded-full text-white shadow-sm hover:opacity-90 transition-opacity ${
                      transparencyScore.score >= 90 ? 'bg-green-600' :
                      transparencyScore.score >= 70 ? 'bg-yellow-500' :
                      transparencyScore.score >= 50 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    title="View transparency report"
                  >
                    <span className="text-xs font-bold">{transparencyScore.score}</span>
                  </a>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orange Cat</h1>
                <p className="text-sm text-gray-500 mt-0.5">Transparent funding and donations in Bitcoin</p>
              </div>
            </div>
            <a 
              href="#transparency" 
              className={`text-sm font-medium flex items-center space-x-1 group ${
                transparencyScore.score >= 90 ? 'text-green-600 hover:text-green-700' :
                transparencyScore.score >= 70 ? 'text-yellow-500 hover:text-yellow-600' :
                transparencyScore.score >= 50 ? 'text-orange-500 hover:text-orange-600' :
                'text-red-500 hover:text-red-600'
              }`}
            >
              <span>Transparency Report</span>
              <svg 
                className={`w-4 h-4 transform group-hover:translate-y-0.5 transition-transform ${
                  transparencyScore.score >= 90 ? 'text-green-600' :
                  transparencyScore.score >= 70 ? 'text-yellow-500' :
                  transparencyScore.score >= 50 ? 'text-orange-500' :
                  'text-red-500'
                }`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>
        </motion.div>

        {/* Fund Us Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          id="fund"
          className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8 scroll-mt-16"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Fund Us</h2>
          <div className="space-y-4 sm:space-y-6">
            {/* Bitcoin Address Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Bitcoin Address</h3>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG value={walletAddress} size={200} />
                </div>
                <div className="flex items-center justify-between w-full">
                  <code className="text-sm font-mono break-all">{walletAddress}</code>
                  <button
                    onClick={() => handleCopy(walletAddress)}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Send Bitcoin to this address to support Orange Cat. All transactions are visible on the blockchain.
            </p>
          </div>
        </motion.div>

        {/* Why Support Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          id="why-support"
          className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8 scroll-mt-16"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Why Support Us?</h2>
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

        {/* Mission Accountability */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          id="mission"
          className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8 scroll-mt-16"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mission Accountability</h2>
          
          {/* Key KPI */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Pages Created</h3>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                Key Metric
              </span>
            </div>
            <div className="flex items-baseline space-x-2 mb-4">
              <p className="text-4xl font-bold text-orange-600">1</p>
              <span className="text-sm text-gray-500">/ 100 target</span>
            </div>
            <div className="mt-2 mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-orange-600 h-2.5 rounded-full" style={{ width: '1%' }}></div>
              </div>
            </div>
            <div className="prose prose-sm text-gray-600">
              <p>
                Pages Created is our primary metric because each new fundraising page represents:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>A new project or cause seeking funding</li>
                <li>Expanded reach and potential donor base</li>
                <li>Growth of the Orange Cat ecosystem</li>
                <li>Validation of our platform&apos;s value</li>
              </ul>
            </div>
          </div>

          {/* Mission Report */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-orange-800">Mission Progress Report</h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>
                    Orange Cat has successfully launched its first page, marking the beginning of our journey. 
                    This initial page serves as a proof of concept and demonstrates our commitment to transparent fundraising.
                  </p>
                  <p className="mt-2">
                    While we&apos;re at 1% of our target, this first page is crucial as it validates our platform&apos;s core functionality
                    and sets the foundation for future growth. We&apos;re actively working on attracting more projects to our platform
                    while maintaining our high standards of transparency and accountability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Financial Accountability */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          id="financial"
          className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8 scroll-mt-16"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Accountability</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Current Balance Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">Current Balance</h3>
                <a 
                  href={`https://mempool.space/address/${walletAddress}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors rounded-full hover:bg-orange-50"
                  title="View on mempool.space"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              {isLoading ? (
                <div className="h-12 w-48 bg-orange-200 rounded animate-pulse" />
              ) : (
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold text-orange-600 tabular-nums">
                    {(walletData?.balance || 0).toFixed(8).replace(/\.?0+$/, '')}
                  </p>
                  <span className="text-lg font-medium text-orange-500">BTC</span>
                </div>
              )}
            </div>

            {/* Transaction History Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                <a 
                  href={`https://mempool.space/address/${walletAddress}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors rounded-full hover:bg-orange-50"
                  title="View on mempool.space"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-orange-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {walletData?.transactions?.slice(0, 3).map((tx: any) => (
                    <div key={tx.txid} className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <a 
                          href={`https://mempool.space/tx/${tx.txid}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-gray-900 hover:text-orange-600 group-hover:text-orange-600 transition-colors"
                        >
                          {tx.txid.slice(0, 8)}...{tx.txid.slice(-8)}
                        </a>
                        <svg className="w-3 h-3 text-gray-400 group-hover:text-orange-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <p className={`text-base font-bold tabular-nums ${
                        tx.type === 'incoming' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {tx.type === 'incoming' ? '+' : '-'}{Number(tx.value).toFixed(8).replace(/\.?0+$/, '')} BTC
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Transparency Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          id="transparency"
          className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8 scroll-mt-16"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Transparency Score</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Financial Accountability</h4>
                </div>
                <span className="text-sm font-medium text-green-600">25/25</span>
              </div>
              <p className="text-sm text-gray-600">
                All transactions are visible and explained.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p>✓ Public transaction history</p>
                <p>✓ Detailed transaction comments</p>
                <p>✓ Regular financial reports</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Community Engagement</h4>
                </div>
                <span className="text-sm font-medium text-green-600">25/25</span>
              </div>
              <p className="text-sm text-gray-600">
                Active response to comments and community feedback.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p>✓ Public communication channels</p>
                <p>✓ Regular community updates</p>
                <p>✓ Responsive to feedback</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          id="projects"
          className="bg-gray-50 rounded-lg shadow-lg p-4 sm:p-6 scroll-mt-16"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">Associated Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Heidi */}
            <a 
              href="/fund-us" 
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">H</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Heidi</h3>
                  <p className="text-xs text-gray-500">AI Swiss German Teacher</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                An AI-powered language learning platform specializing in Swiss German.
              </p>
            </a>

            {/* Nerd */}
            <a 
              href="/fund-us" 
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">N</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Nerd</h3>
                  <p className="text-xs text-gray-500">AI Research Partner</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                A collaborative AI research platform for developers and researchers.
              </p>
            </a>

            {/* Katzerei */}
            <a 
              href="/fund-us" 
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-600">K</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Katzerei</h3>
                  <p className="text-xs text-gray-500">Tech & Music Space</p>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                A creative space for coding projects and electronic music experimentation.
              </p>
            </a>
          </div>
        </motion.div>

        {/* Create Your Own Page CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-lg p-8 mb-8"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Your Own Fundraising Page</h2>
            <p className="text-xl text-gray-600 mb-6">
              Inspired by what you see? Create your own transparent fundraising page in minutes.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Setup</h3>
                <p className="text-gray-600">Get started in minutes with our intuitive page builder</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Built-in Transparency</h3>
                <p className="text-gray-600">Automatic tracking and reporting of all donations</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Support</h3>
                <p className="text-gray-600">Join a growing community of transparent fundraisers</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/create"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                Create Your Page Now
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <a
                href="/learn-more"
                className="inline-flex items-center justify-center px-6 py-3 border border-orange-600 text-base font-medium rounded-md text-orange-600 bg-white hover:bg-orange-50 transition-colors"
              >
                Learn More
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 