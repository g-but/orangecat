import { Metadata } from 'next';
import Link from 'next/link';
import { Bitcoin, Shield, Zap, Lock, Globe, Code, Server, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Technology | OrangeCat',
  description:
    'Learn about the technology powering OrangeCat - Bitcoin-native crowdfunding with transparency, security, and zero platform fees.',
  openGraph: {
    title: 'Our Technology | OrangeCat',
    description: 'Bitcoin-native crowdfunding built on modern web technology',
    type: 'website',
  },
};

export default function TechnologyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-orange-600 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-orange-800 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Built on Bitcoin
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-orange-100">
              Direct, transparent, and unstoppable crowdfunding powered by the world's most secure
              network
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Core Principles */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Core Principles</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-orange-500">
              <Bitcoin className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bitcoin-Native</h3>
              <p className="text-gray-600">
                True peer-to-peer payments with no intermediaries. Your Bitcoin, your control.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-orange-500">
              <Shield className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Transparent</h3>
              <p className="text-gray-600">
                All transactions are publicly verifiable on the Bitcoin blockchain. No hidden fees.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-orange-500">
              <Zap className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Zero Platform Fees</h3>
              <p className="text-gray-600">
                We don't take a cut. 100% of your support goes directly to creators.
              </p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Technology Stack</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Frontend */}
              <div>
                <div className="flex items-center mb-4">
                  <Globe className="h-6 w-6 text-orange-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">Frontend</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Next.js 15</span>
                      <p className="text-sm text-gray-600">
                        Modern React framework with App Router
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">TypeScript</span>
                      <p className="text-sm text-gray-600">Type-safe development</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Tailwind CSS</span>
                      <p className="text-sm text-gray-600">Responsive, mobile-first design</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Backend */}
              <div>
                <div className="flex items-center mb-4">
                  <Server className="h-6 w-6 text-orange-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">Backend</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Supabase</span>
                      <p className="text-sm text-gray-600">
                        PostgreSQL database with real-time capabilities
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Row Level Security</span>
                      <p className="text-sm text-gray-600">Database-level authorization</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Edge Functions</span>
                      <p className="text-sm text-gray-600">Serverless API endpoints</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Bitcoin */}
              <div>
                <div className="flex items-center mb-4">
                  <Bitcoin className="h-6 w-6 text-orange-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">Bitcoin Integration</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Native Bitcoin Addresses</span>
                      <p className="text-sm text-gray-600">Direct wallet-to-wallet transfers</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Lightning Network Ready</span>
                      <p className="text-sm text-gray-600">Fast, low-cost micropayments</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Non-Custodial</span>
                      <p className="text-sm text-gray-600">You control your private keys</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Security */}
              <div>
                <div className="flex items-center mb-4">
                  <Lock className="h-6 w-6 text-orange-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">Security</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">End-to-End Encryption</span>
                      <p className="text-sm text-gray-600">Secure data transmission</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">OAuth 2.0</span>
                      <p className="text-sm text-gray-600">Secure authentication</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">HTTPS Only</span>
                      <p className="text-sm text-gray-600">Encrypted connections</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Open Source */}
        <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg p-8 text-center">
          <Code className="h-16 w-16 text-orange-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Open Source Philosophy</h2>
          <p className="text-lg text-gray-700 mb-6 max-w-3xl mx-auto">
            We believe in transparency and community-driven development. Our code is open for
            review, contributions, and audits by the Bitcoin community.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/discover"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              Discover Projects
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center px-6 py-3 border border-orange-600 text-base font-medium rounded-md text-orange-600 bg-white hover:bg-orange-50"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
