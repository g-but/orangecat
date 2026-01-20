import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Building, Heart, Zap, TreePine } from 'lucide-react';
import BitBaumLogo from '@/components/layout/BitBaumLogo';

export const metadata: Metadata = {
  title: 'About OrangeCat - A BitBaum Company',
  description:
    'Learn about OrangeCat, the Bitcoin Super-App for commerce, finance, community, and AI, and our parent company BitBaum.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-tiffany-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              About <span className="text-tiffany-600">OrangeCat</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              The Bitcoin Super-App—unifying commerce, finance, community, and AI. A BitBaum company.
            </p>
          </div>
        </div>
      </div>

      {/* Corporate Structure */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Corporate Structure</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Like TikTok and ByteDance, OrangeCat is our consumer-facing product while BitBaum serves
            as our corporate parent company.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* BitBaum */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <BitBaumLogo className="scale-150" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">BitBaum AG</h3>
            <p className="text-gray-600 mb-6">
              Our corporate parent company, focused on building the future of Bitcoin commerce
              through innovative products and services.
            </p>
            <div className="flex justify-center space-x-4 mb-6">
              <div className="flex items-center text-sm text-gray-500">
                <Building className="w-4 h-4 mr-2" />
                Corporate
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <TreePine className="w-4 h-4 mr-2" />
                Tree Metaphor
              </div>
            </div>
            <Link
              href="https://bitbaum.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              Visit BitBaum
            </Link>
          </div>

          {/* OrangeCat */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🐱</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">OrangeCat</h3>
            <p className="text-gray-600 mb-6">
              Our flagship product—the Bitcoin Super-App that unifies commerce, finance, community, and AI.
              Everything you need in one friendly, approachable platform.
            </p>
            <div className="flex justify-center space-x-4 mb-6">
              <div className="flex items-center text-sm text-gray-500">
                <Heart className="w-4 h-4 mr-2" />
                Consumer Product
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Zap className="w-4 h-4 mr-2" />
                Bitcoin Native
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
            >
              Use OrangeCat
            </Link>
          </div>
        </div>
      </div>

      {/* Mission & Values */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Empower individuals and communities with a unified platform for Bitcoin-powered commerce, finance,
              collaboration, and innovation—all with complete transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TreePine className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Grow Together</h3>
              <p className="text-gray-600">
                Build interconnected communities where ideas branch and flourish like trees.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-tiffany-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-tiffany-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bitcoin Native</h3>
              <p className="text-gray-600">
                Every transaction is transparent, borderless, and powered by Bitcoin's network.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community First</h3>
              <p className="text-gray-600">
                Empower creators, supporters, and communities to thrive together.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-orange-500 to-tiffany-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Join Our Growing Community</h2>
            <p className="text-xl text-orange-100 mb-8">
              Sell products, offer services, fund projects, build communities, and deploy AI—all with Bitcoin.
            </p>
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-orange-600 bg-white hover:bg-gray-50 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
