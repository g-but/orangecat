'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Copy, Check } from 'lucide-react'

export default function DonatePage() {
  const params = useParams()
  const walletAddress = params.walletAddress as string
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Support with Bitcoin
            </h1>
            <p className="text-gray-600">
              Scan the QR code or copy the address below to send Bitcoin
            </p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            {/* QR Code Placeholder - You can integrate a QR code generator here */}
            <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">QR Code</span>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitcoin Address
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={walletAddress}
                  readOnly
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5 mr-2" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 