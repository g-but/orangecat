import React from 'react';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'System Status | OrangeCat',
  description: 'Current system status for OrangeCat platform services.',
};

const SERVICES = [
  { name: 'Website' },
  { name: 'Authentication' },
  { name: 'Database' },
  { name: 'API' },
  { name: 'Bitcoin Integration' },
];

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">System Status</h1>
          <p className="text-xl text-gray-600">
            Current status of OrangeCat platform services
          </p>
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">All Systems Operational</h2>
              <p className="text-gray-600">All OrangeCat services are running normally</p>
            </div>
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Services</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {SERVICES.map(service => (
              <div key={service.name} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-900">{service.name}</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-700 bg-green-100">
                  Operational
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Incident History placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
          </div>
          <div className="px-6 py-8 text-center">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No incidents reported in the last 30 days.</p>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Experiencing Issues?</h3>
              <p className="text-blue-700 mb-4">
                If you&apos;re experiencing problems, check our FAQ or reach out to support.
              </p>
              <div className="flex gap-4">
                <Link href="/faq" className="text-blue-600 hover:text-blue-800 font-medium">
                  Visit FAQ →
                </Link>
                <a
                  href="mailto:support@orangecat.ch"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Contact Support →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
