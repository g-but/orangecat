'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Hero from '@/components/sections/Hero';

export default function HomePublicClient() {
  return (
    <>
      {/* Experimental Version Notice */}
      <div className="bg-gradient-to-r from-orange-100 to-tiffany-100 border-b border-orange-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-orange-600 font-medium">🚧 Experimental Version</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-600">
              This is a development preview - features may not work as expected
            </span>
            <span className="text-gray-600">•</span>
            <a
              href="https://github.com/g-but/orangecat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 font-medium underline"
            >
              View Source
            </a>
          </div>
        </div>
      </div>

      <Hero />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Introduction Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            The Bitcoin Yellow Pages
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Just like the yellow pages had phone numbers, we have Bitcoin wallets. Create wallets
            for yourself, your projects, organizations, or anyone you care about. Build circles of
            trust and support with the power of Bitcoin - whether you're organizing a cat shelter,
            art exhibition, community party, or any cause that matters.
          </p>
        </div>

        {/* Features Grid (subset for brevity) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-tiffany-500/10 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-tiffany-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Quick Setup</h3>
            </div>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Create your customized donation page in minutes with no technical knowledge required.
            </p>
          </Card>

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-tiffany-500/10 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-tiffany-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Instant Payouts</h3>
            </div>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Receive donations directly to your Bitcoin wallet with no intermediaries or delays.
            </p>
          </Card>

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-tiffany-500/10 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-tiffany-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c0-1.1.9-2 2-2h2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-2a2 2 0 00-2-2h-2a2 2 0 01-2-2v0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Simple Management</h3>
            </div>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Keep everything organized with clear dashboards and automatic tracking.
            </p>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild variant="primary">
            <a href="/signup">Get Started</a>
          </Button>
        </div>
      </div>
    </>
  );
}
