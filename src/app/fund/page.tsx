'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Bitcoin, Zap, Info } from 'lucide-react'
import { TransparencyScore } from '@/components/transparency/TransparencyScore'
import { calculateTransparencyScore, TRANSPARENCY_METRICS } from '@/lib/transparency'
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet'

export default function FundPage() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'bitcoin' | 'lightning'>('bitcoin')
  const [activeSection, setActiveSection] = useState<string>('')
  const walletAddress = process.env.NEXT_PUBLIC_BITCOIN_ADDRESS || ''
  const { walletData, isLoading, error, refresh } = useBitcoinWallet(walletAddress)

  const bitcoinAddress = walletAddress
  const lightningAddress = 'palfare@getalby.com'

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
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-16 bg-white shadow-lg">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:ml-16">
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
          className="bg-white rounded-lg shadow-lg p-6 mb-8 scroll-mt-16"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Fund Us</h2>
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
                  <span>Bitcoin (Recommended)</span>
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
                  <span>Lightning (Fast & Cheap)</span>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="pt-4">
              {activeTab === 'bitcoin' ? (
                <div className="space-y-6">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">About Bitcoin</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Bitcoin is a digital currency that can be sent anywhere in the world. It&apos;s secure, decentralized, and perfect for larger donations.
                        </p>
                      </div>
                    </div>
                  </div>
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
                  <div className="text-sm text-gray-500 text-center">
                    Scan the QR code or copy the address to send Bitcoin
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">About Lightning Network</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Lightning Network enables instant Bitcoin payments with minimal fees. Perfect for small, regular donations.
                        </p>
                      </div>
                    </div>
                  </div>
                  {lightningAddress ? (
                    <>
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
                      <div className="text-sm text-gray-500 text-center">
                        Scan the QR code or copy the address to send via Lightning
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Lightning address coming soon</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Why Support Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          id="why-support"
          className="bg-white rounded-lg shadow-lg p-6 mb-8 scroll-mt-16"
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
          className="bg-white rounded-lg shadow-lg p-6 mb-8 scroll-mt-16"
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
          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
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
          className="bg-white rounded-lg shadow-lg p-6 mb-8 scroll-mt-16"
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={refresh}
                    className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors rounded-full hover:bg-orange-50"
                    title="Refresh transactions"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
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
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {walletData?.transactions?.slice(0, 5).map((tx) => (
                    <div key={tx.txid} className="group bg-gray-50 rounded-lg p-3 hover:bg-orange-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              tx.type === 'incoming' 
                                ? 'bg-green-50 text-green-700' 
                                : 'bg-orange-50 text-orange-700'
                            }`}>
                              {tx.type === 'incoming' ? 'Received' : 'Sent'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              tx.status === 'confirmed' 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
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
                          <p className="text-xs text-gray-500">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                          {tx.txid === walletData?.transactions?.[0]?.txid && (
                            <div className="mt-2 text-sm text-gray-600 italic">
                              &ldquo;Initial test transaction from founder to verify system functionality&rdquo;
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-base font-bold tabular-nums ${
                            tx.type === 'incoming' ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {tx.type === 'incoming' ? '+' : '-'}{Number(tx.value).toFixed(8).replace(/\.?0+$/, '')} BTC
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Financial Report */}
          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-orange-800">Financial Report</h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>
                    Our financial journey has begun with an initial test transaction from the founder to verify system functionality.
                    This transaction demonstrates our commitment to transparency and proper system testing.
                  </p>
                  <p className="mt-2">
                    As we grow, we will provide regular financial reports explaining all significant transactions
                    and their purposes. Our goal is to maintain complete transparency in how funds are received
                    and utilized to support the Orange Cat platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transparency Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          id="transparency"
          className="bg-white rounded-lg shadow-lg p-6 mb-8 scroll-mt-16"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Transparency Report</h2>
          <div className="space-y-6">
            {/* Transparency Score */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Transparency Score</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-green-600">{transparencyScore.score}</span>
                  <span className="text-sm text-gray-500">/ 100</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${transparencyScore.score}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-green-700">
                {transparencyScore.description}
              </p>
            </div>

            {/* Transparency Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">Open Source</h4>
                  </div>
                  <span className="text-sm font-medium text-green-600">25/25</span>
                </div>
                <p className="text-sm text-gray-600">
                  Project code is publicly available and contributions are welcome.
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  <p>✓ Full source code access</p>
                  <p>✓ Active contribution guidelines</p>
                  <p>✓ Public issue tracking</p>
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
                    <h4 className="text-sm font-medium text-gray-900">Mission Accountability</h4>
                  </div>
                  <span className="text-sm font-medium text-green-600">25/25</span>
                </div>
                <p className="text-sm text-gray-600">
                  Clear KPIs and regular progress reports are provided.
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  <p>✓ Defined mission statement</p>
                  <p>✓ Measurable KPIs</p>
                  <p>✓ Regular progress updates</p>
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

            {/* Transparency Assessment */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-800">Transparency Assessment</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Orange Cat has achieved a perfect transparency score by meeting all criteria at the highest level.
                      Our commitment to openness is demonstrated through:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Complete open-source development with public repositories</li>
                      <li>Clear mission KPIs with regular progress tracking</li>
                      <li>Detailed financial reporting with transaction explanations</li>
                      <li>Active community engagement and feedback response</li>
                    </ul>
                    <p className="mt-2">
                      This perfect score reflects our dedication to maintaining the highest standards of transparency
                      and accountability in all aspects of our project.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Associated Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          id="projects"
          className="bg-gray-50 rounded-lg shadow-lg p-6 scroll-mt-16"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">Associated Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Heidi */}
            <a 
              href="/fund" 
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
              href="/fund" 
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
              href="/fund" 
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
      </div>
    </div>
  )
} 