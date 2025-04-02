import React from 'react'
import { notFound } from 'next/navigation'

interface Props {
  params: {
    walletAddress: string
  }
}

export default function DonatePage({ params }: Props) {
  const { walletAddress } = params

  if (!walletAddress) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Donate Bitcoin
          </h1>
          <p className="mt-3 text-xl text-gray-500 sm:mt-4">
            Scan the QR code or copy the address below to donate
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
          <div className="text-center">
            <div className="mb-4">
              {/* QR Code will go here */}
              <div className="w-48 h-48 bg-gray-200 mx-auto"></div>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Bitcoin Address</p>
              <p className="mt-1 text-lg font-mono break-all">{walletAddress}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Copy Address
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 