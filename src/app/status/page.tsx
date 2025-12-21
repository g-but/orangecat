import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

export const metadata = {
  title: 'System Status | OrangeCat',
  description: 'Current system status and uptime information for OrangeCat platform',
};

export default function StatusPage() {
  // Mock status data - in a real app, this would come from monitoring APIs
  const services = [
    {
      name: 'Website',
      status: 'operational',
      uptime: '99.9%',
      lastChecked: new Date().toLocaleString(),
    },
    {
      name: 'Authentication',
      status: 'operational',
      uptime: '99.8%',
      lastChecked: new Date().toLocaleString(),
    },
    {
      name: 'Database',
      status: 'operational',
      uptime: '99.9%',
      lastChecked: new Date().toLocaleString(),
    },
    {
      name: 'API',
      status: 'operational',
      uptime: '99.7%',
      lastChecked: new Date().toLocaleString(),
    },
    {
      name: 'Bitcoin Integration',
      status: 'operational',
      uptime: '99.9%',
      lastChecked: new Date().toLocaleString(),
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-700 bg-green-100';
      case 'degraded':
        return 'text-yellow-700 bg-yellow-100';
      case 'down':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            System Status
          </h1>
          <p className="text-xl text-gray-600">
            Current status and uptime information for OrangeCat services
          </p>
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  All Systems Operational
                </h2>
                <p className="text-gray-600">
                  All OrangeCat services are running normally
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Service Status
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {services.map((service, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {service.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {service.uptime} uptime
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Last checked</p>
                      <p className="text-xs text-gray-900">
                        {service.lastChecked}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Experiencing Issues?
          </h3>
          <p className="text-blue-700 mb-4">
            If you're experiencing problems with OrangeCat, please check our FAQ or contact our support team.
          </p>
          <div className="flex space-x-4">
            <a
              href="/faq"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Visit FAQ →
            </a>
            <a
              href="mailto:support@orangecat.com"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Contact Support →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}












