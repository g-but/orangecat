import React from 'react';
import { Shield, Lock, Eye, Server, Key, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Security | OrangeCat',
  description:
    "Learn about OrangeCat's security practices, data protection, and commitment to user privacy",
};

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All data transmission is encrypted using industry-standard TLS 1.3 protocols.',
    },
    {
      icon: Key,
      title: 'Self-Custody Bitcoin',
      description:
        'We never hold your Bitcoin. You maintain full control over your private keys and funds.',
    },
    {
      icon: Shield,
      title: 'Row Level Security',
      description: 'Database-level authorization ensures users can only access their own data.',
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'Hosted on enterprise-grade cloud infrastructure with 99.9% uptime SLA.',
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'Open source codebase allows for public security audits and community review.',
    },
    {
      icon: AlertTriangle,
      title: 'Security Monitoring',
      description: '24/7 monitoring and automated alerts for suspicious activity.',
    },
  ];

  const securityPractices = [
    {
      title: 'Authentication & Authorization',
      items: [
        'Multi-factor authentication support',
        'Secure password hashing with bcrypt',
        'Session management with automatic expiration',
        'OAuth 2.0 integration for social login',
      ],
    },
    {
      title: 'Data Protection',
      items: [
        'Personal data encryption at rest',
        'Regular security audits and penetration testing',
        'GDPR compliance for EU users',
        'Data minimization principles',
      ],
    },
    {
      title: 'Bitcoin Security',
      items: [
        'No custody of user funds',
        'Support for hardware wallet integration',
        'Lightning Network payment security',
        'Transaction transparency on blockchain',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Security & Privacy</h1>
          <p className="text-xl text-gray-600">
            Your security and privacy are our top priorities at OrangeCat
          </p>
        </div>

        {/* Security Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Security Philosophy</h2>
          <p className="text-gray-700 mb-6">
            OrangeCat is built on Bitcoin-first principles, which means we prioritize
            decentralization, self-custody, and transparency. We never hold your funds, and we
            design our systems to minimize the data we collect while maximizing security.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Bitcoin Security</h3>
              <p className="text-blue-700 text-sm">
                Your Bitcoin remains under your control. We facilitate payments but never custody
                funds.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Data Minimization</h3>
              <p className="text-green-700 text-sm">
                We collect only the minimum data necessary to provide our services.
              </p>
            </div>
          </div>
        </div>

        {/* Security Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Security Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security Practices */}
        <div className="space-y-8">
          {securityPractices.map((practice, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">{practice.title}</h3>
              <ul className="space-y-3">
                {practice.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gray-900 text-white rounded-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4">Security Concerns?</h3>
            <p className="mb-6 text-gray-300">
              If you have security concerns or believe you've discovered a vulnerability, please
              contact us immediately.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:security@orangecat.com"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Report Security Issue
              </a>
              <a
                href="/docs"
                className="inline-flex items-center px-6 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
              >
                View Documentation
              </a>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-8 text-center text-gray-500">
          <p className="text-sm">
            This security page was last updated on {new Date().toLocaleDateString()}. Our security
            practices are continuously reviewed and updated.
          </p>
        </div>
      </div>
    </div>
  );
}



