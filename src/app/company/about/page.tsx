import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Users, Heart, Zap, TreePine, Target, Award } from 'lucide-react';
import BitBaumLogo from '@/components/layout/BitBaumLogo';

export const metadata: Metadata = {
  title: 'About BitBaum - Growing Bitcoin Communities',
  description:
    'Learn about BitBaum, the corporate parent of OrangeCat, and our mission to build the future of Bitcoin commerce through threaded conversations and transparent transactions.',
};

export default function BitBaumAboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-tiffany-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <BitBaumLogo className="scale-150" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
              About <span className="text-orange-600">BitBaum</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Growing Bitcoin communities through transparent commerce and threaded conversations.
              The corporate parent of OrangeCat.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
            <Target className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            To inspire creativity, enrich lives, and grow interconnected communities through
            Bitcoin-powered platforms that make commerce transparent, conversations meaningful, and
            value creation accessible to everyone.
          </p>
        </div>

        {/* Brand Relationship */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Brand Structure</h3>
            <p className="text-gray-600">
              Like TikTok and ByteDance, we separate our consumer product from our corporate
              identity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BitBaum */}
            <div className="text-center p-6 border border-gray-200 rounded-xl">
              <div className="flex justify-center mb-4">
                <BitBaumLogo />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">BitBaum AG</h4>
              <p className="text-gray-600 mb-4">
                Corporate parent company focused on Bitcoin innovation, community building, and
                creating platforms that empower creators and communities worldwide.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  Corporate
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  Swiss-Based
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Innovation
                </span>
              </div>
            </div>

            {/* OrangeCat */}
            <div className="text-center p-6 border border-gray-200 rounded-xl">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🐱</span>
                </div>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">OrangeCat</h4>
              <p className="text-gray-600 mb-4">
                Our flagship consumer product - the friendly Bitcoin crowdfunding platform where
                users create, connect, and transact in a threaded conversation ecosystem.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  Consumer Product
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                  Bitcoin Native
                </span>
                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                  Community
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">BitBaum Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TreePine className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Grow Together</h4>
              <p className="text-gray-600 text-sm">
                Build interconnected communities where ideas branch and flourish like trees in a
                forest.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Bitcoin First</h4>
              <p className="text-gray-600 text-sm">
                Every platform we build is Bitcoin-native, transparent, and censorship-resistant.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Community First</h4>
              <p className="text-gray-600 text-sm">
                Empower creators, supporters, and communities to thrive through collective action.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Always Day 1</h4>
              <p className="text-gray-600 text-sm">
                Maintain entrepreneurial mindset, innovate relentlessly, and stay humble.
              </p>
            </div>
          </div>
        </div>

        {/* History & Future */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* History */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-4 mt-1">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Founded in Switzerland</h4>
                  <p className="text-gray-600 text-sm">
                    BitBaum AG established as a Swiss company committed to Bitcoin innovation.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-4 mt-1">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">OrangeCat Launch</h4>
                  <p className="text-gray-600 text-sm">
                    Released our flagship Bitcoin crowdfunding platform with threaded conversations.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-4 mt-1">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Community Growth</h4>
                  <p className="text-gray-600 text-sm">
                    Thousands of creators and supporters building with Bitcoin.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Future Vision */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Vision</h3>
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">Bitcoin Commerce Ecosystem</h4>
                <p className="text-orange-700 text-sm">
                  Build a suite of Bitcoin-native platforms for every aspect of commerce and
                  community.
                </p>
              </div>

              <div className="p-4 bg-tiffany-50 rounded-lg">
                <h4 className="font-semibold text-tiffany-900 mb-2">Threaded Intelligence</h4>
                <p className="text-tiffany-700 text-sm">
                  Create AI systems that understand conversation trees and community knowledge.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Global Communities</h4>
                <p className="text-green-700 text-sm">
                  Empower communities worldwide to organize, fund, and govern collectively.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section Placeholder */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Team</h3>
          <p className="text-gray-600 mb-6">
            A passionate team of Bitcoin enthusiasts, developers, and community builders working
            from Switzerland and around the world.
          </p>
          <Link
            href="/company/careers"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
          >
            Join Our Team
          </Link>
        </div>
      </div>
    </div>
  );
}
