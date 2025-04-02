'use client'

import { motion } from 'framer-motion'
import { Bitcoin, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface WalletSectionProps {
  walletAddress: string
}

export function WalletSection({ walletAddress }: WalletSectionProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="card mb-12"
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-tiffany/10 text-tiffany mb-6 mx-auto">
        <Bitcoin className="w-8 h-8" />
      </div>

      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Bitcoin Address</h3>
          <div className="flex items-center justify-center space-x-2">
            <code className="text-sm bg-slate-100 px-3 py-2 rounded-lg font-mono">
              {walletAddress}
            </code>
            <button
              onClick={copyToClipboard}
              className="p-2 text-slate-400 hover:text-tiffany transition-colors"
              aria-label="Copy address"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Scan QR Code</h3>
          <div className="bg-white p-4 rounded-xl inline-block">
            <QRCodeSVG
              value={`bitcoin:${walletAddress}`}
              size={192}
              level="H"
              includeMargin={true}
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="text-center text-slate-600">
          <p>Thank you for supporting our mission!</p>
        </div>
      </div>
    </motion.div>
  )
} 