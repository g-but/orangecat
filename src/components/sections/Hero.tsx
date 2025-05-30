import Link from 'next/link'
import Button from '@/components/ui/Button'
import { ArrowRight, Bitcoin, Building2, Rocket, Shield, Heart, Users } from 'lucide-react'

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-tiffany-50 to-white" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-10rem)] flex flex-col justify-center py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              <span className="block">Fund Anything</span>
              <span className="block mt-2">
                <span className="text-tiffany-600">With </span>
                <span className="text-orange-500">Bitcoin</span>
              </span>
            </h1>
            <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-gray-500 leading-relaxed px-4 sm:px-0">
              Fund yourself, your loved ones, your organization, or any project with Bitcoin. 
              Create a transparent funding page and start receiving donations instantly.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
              <Link href="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 min-h-[48px] sm:min-h-[52px]">
                  Create Funding Page
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link href="/about" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 min-h-[48px] sm:min-h-[52px]">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-12 sm:mt-16 lg:mt-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              <div className="relative p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex-shrink-0 mb-3 sm:mb-0">
                    <Bitcoin className="h-6 w-6 sm:h-8 sm:w-8 text-tiffany-500" />
                  </div>
                  <div className="sm:ml-4">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Bitcoin-Powered</h3>
                    <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500 leading-snug">
                      Built on Bitcoin for secure, global transactions with no platform fees
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex-shrink-0 mb-3 sm:mb-0">
                    <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-tiffany-500" />
                  </div>
                  <div className="sm:ml-4">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">For Everyone</h3>
                    <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500 leading-snug">
                      Fund yourself, loved ones, or any cause you care about
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex-shrink-0 mb-3 sm:mb-0">
                    <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-tiffany-500" />
                  </div>
                  <div className="sm:ml-4">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Organizations</h3>
                    <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500 leading-snug">
                      Perfect for projects, charities, and businesses
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex-shrink-0 mb-3 sm:mb-0">
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-tiffany-500" />
                  </div>
                  <div className="sm:ml-4">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Transparent</h3>
                    <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500 leading-snug">
                      Real-time tracking and public funding history
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 sm:mt-16 text-center px-4 sm:px-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500">Powered by Bitcoin technology</p>
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8">
              <div className="text-gray-400 text-sm">No Platform Fees</div>
              <div className="text-gray-400 text-sm">Global Access</div>
              <div className="text-gray-400 text-sm">Self-Custody</div>
            </div>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
              We connect people and enable Bitcoin payments. You keep your keys, we keep it simple.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 