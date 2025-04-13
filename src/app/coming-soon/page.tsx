import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Coming Soon | OrangeCat',
  description: 'OrangeCat is coming soon. A platform for transparent Bitcoin donations.',
};

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Coming Soon!
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            OrangeCat is under development. We're building something special for the Bitcoin community.
          </p>
          
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Link href="/blog" className="group">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-accent-600">Read Our Blog</h3>
                <p className="mt-2 text-gray-600">Discover stories from our community</p>
              </div>
            </Link>
            
            <Link href="/about" className="group">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-accent-600">About Us</h3>
                <p className="mt-2 text-gray-600">Learn more about our mission</p>
              </div>
            </Link>
            
            <Link href="/donate" className="group">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-accent-600">Support Us</h3>
                <p className="mt-2 text-gray-600">Help us build the future</p>
              </div>
            </Link>
          </div>
          
          <div className="mt-12">
            <div className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-accent-600 hover:bg-accent-700">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Building something amazing...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 