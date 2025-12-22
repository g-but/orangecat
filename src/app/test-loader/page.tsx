'use client';

import { useState } from 'react';
import { ContextualLoader } from '@/components/navigation/ContextualLoader';

const routes = [
  '/',
  '/dashboard',
  '/dashboard/projects',
  '/dashboard/services',
  '/dashboard/causes',
  '/dashboard/wallets',
  '/assets',
  '/loans',
  '/organizations',
  '/messages',
  '/settings',
  '/about',
  '/blog',
  '/docs',
  '/discover',
  '/timeline',
];

export default function TestLoaderPage() {
  const [selectedRoute, setSelectedRoute] = useState('/dashboard');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🚀 Contextual Loader Test</h1>
          <p className="text-lg text-gray-600">
            Select a route to see the contextual loading experience
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {routes.map(route => (
            <button
              key={route}
              onClick={() => setSelectedRoute(route)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedRoute === route
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {route === '/' ? 'Home' : route.split('/').pop() || route}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Loading experience for:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{selectedRoute}</code>
            </h2>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <ContextualLoader pathname={selectedRoute} />
          </div>
        </div>
      </div>
    </div>
  );
}
