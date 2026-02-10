import Link from 'next/link';
export const dynamic = 'force-dynamic';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4">
      <div className="max-w-lg w-full space-y-8 p-6 bg-white rounded-xl shadow-xl border border-orange-100">
        {/* Icon */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🔍</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Page Not Found</h2>
          <p className="mt-3 text-base text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>

          <Link
            href="/discover"
            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <Search className="h-4 w-4" />
            Discover Projects
          </Link>

          <Link
            href="/"
            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Homepage
          </Link>
        </div>

        {/* Help text */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Looking for something specific?{' '}
            <Link href="/faq" className="text-orange-600 hover:text-orange-700 font-medium">
              Visit our FAQ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
