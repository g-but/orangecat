import Link from 'next/link'
import Button from '@/components/ui/Button'
import { ArrowRight, Bitcoin, Building2, Rocket, Shield, Heart, Users } from 'lucide-react'

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-tiffany-50 to-white" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Fund Anything</span>
            <span className="block text-tiffany-600">With Bitcoin</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Fund yourself, your loved ones, your organization, or any project with Bitcoin. 
            Create a transparent funding page and start receiving donations instantly.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8">
                Create Funding Page
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="text-lg px-8">
                How It Works
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Bitcoin className="h-8 w-8 text-tiffany-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Bitcoin & Lightning</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Accept both on-chain Bitcoin and Lightning Network payments
                  </p>
                </div>
              </div>
            </div>

            <div className="relative p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Heart className="h-8 w-8 text-tiffany-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">For Everyone</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Fund yourself, loved ones, or any cause you care about
                  </p>
                </div>
              </div>
            </div>

            <div className="relative p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-8 w-8 text-tiffany-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Organizations</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Perfect for projects, charities, and businesses
                  </p>
                </div>
              </div>
            </div>

            <div className="relative p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-8 w-8 text-tiffany-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Transparent</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Real-time tracking and public funding history
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <p className="text-sm font-medium text-gray-500">Built on Bitcoin principles</p>
          <div className="mt-6 flex justify-center space-x-8">
            <div className="text-gray-400">No Platform Fees</div>
            <div className="text-gray-400">Self-Custody Only</div>
            <div className="text-gray-400">Open Source</div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            We're just connecting minds and wallets. You keep your keys, we keep it simple.
          </p>
        </div>
      </div>
    </div>
  )
} 