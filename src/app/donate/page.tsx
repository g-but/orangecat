'use client'

import Image from 'next/image';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DonatePage() {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bitcoin' | 'lightning'>('bitcoin');
  
  const bitcoinAddress = process.env.NEXT_PUBLIC_BITCOIN_ADDRESS;
  const lightningAddress = process.env.NEXT_PUBLIC_LIGHTNING_ADDRESS;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handlePaymentMethodChange = (method: 'bitcoin' | 'lightning') => {
    setPaymentMethod(method);
  };

  const getPaymentURI = () => {
    if (paymentMethod === 'bitcoin' && bitcoinAddress) {
      return `bitcoin:${bitcoinAddress}${amount ? `?amount=${amount}` : ''}`;
    }
    if (paymentMethod === 'lightning' && lightningAddress) {
      return `lightning:${lightningAddress}${amount ? `?amount=${amount}` : ''}`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Support Our Mission
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Your support helps us continue building OrangeCat and making Bitcoin donations accessible to everyone.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900">Why Donate?</h2>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-gray-600">Support independent creators and their work</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-gray-600">Help build a fair and transparent platform</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-gray-600">Contribute to the future of creator economy</p>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900">Make a Donation</h2>
            <p className="mt-4 text-gray-600">
              Your support helps us continue building and improving our platform. Every contribution makes a difference.
            </p>
            <div className="mt-8">
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => handlePaymentMethodChange('bitcoin')}
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    paymentMethod === 'bitcoin'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Bitcoin
                </button>
                <button
                  onClick={() => handlePaymentMethodChange('lightning')}
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    paymentMethod === 'lightning'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Lightning
                </button>
              </div>

              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount (optional)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount in BTC"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                {getPaymentURI() && (
                  <QRCodeSVG
                    value={getPaymentURI()}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                )}
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Scan the QR code with your Bitcoin wallet
                </p>
                {paymentMethod === 'bitcoin' && bitcoinAddress && (
                  <p className="mt-2 text-sm font-mono bg-gray-100 p-2 rounded">
                    {bitcoinAddress}
                  </p>
                )}
                {paymentMethod === 'lightning' && lightningAddress && (
                  <p className="mt-2 text-sm font-mono bg-gray-100 p-2 rounded">
                    {lightningAddress}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Other Ways to Support</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900">Become a Creator</h3>
              <p className="mt-2 text-gray-600">Join our platform and start sharing your work</p>
              <Link href="/create" className="mt-4 inline-block text-accent-600 hover:text-accent-700">
                Learn more →
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900">Spread the Word</h3>
              <p className="mt-2 text-gray-600">Share our mission with your community</p>
              <div className="mt-4 flex justify-center space-x-4">
                {/* Add social sharing buttons here */}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900">Join Our Community</h3>
              <p className="mt-2 text-gray-600">Connect with other creators and supporters</p>
              <Link href="/blog" className="mt-4 inline-block text-accent-600 hover:text-accent-700">
                Explore →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 