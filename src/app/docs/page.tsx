'use client';

import Card from '@/components/ui/Card';
import { Code2, Database, Shield, Bitcoin, Building2, Globe } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-tiffany-500">Documentation</h1>
          <p className="mt-4 text-xl text-gray-600">
            Learn about OrangeCat&apos;s architecture, features, and how to use it
          </p>
        </div>

        {/* Tech Stack */}
        <Card className="mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tech Stack</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Frontend</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Code2 className="h-5 w-5 text-tiffany-500 mr-3" />
                    <span>Next.js 14 with App Router</span>
                  </li>
                  <li className="flex items-center">
                    <Code2 className="h-5 w-5 text-tiffany-500 mr-3" />
                    <span>React with TypeScript</span>
                  </li>
                  <li className="flex items-center">
                    <Code2 className="h-5 w-5 text-tiffany-500 mr-3" />
                    <span>Tailwind CSS for styling</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Backend</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Database className="h-5 w-5 text-tiffany-500 mr-3" />
                    <span>Supabase for authentication and database</span>
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-5 w-5 text-tiffany-500 mr-3" />
                    <span>Row Level Security for data protection</span>
                  </li>
                  <li className="flex items-center">
                    <Bitcoin className="h-5 w-5 text-orange-500 mr-3" />
                    <span>Bitcoin and Lightning Network integration</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Project Structure */}
        <Card className="mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Project Structure</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Core Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Building2 className="h-5 w-5 text-tiffany-500 mr-3 mt-1" />
                    <div>
                      <span className="font-medium">Funding Pages</span>
                      <p className="text-gray-600">
                        Create and manage funding pages for individuals, organizations, and projects
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Bitcoin className="h-5 w-5 text-orange-500 mr-3 mt-1" />
                    <div>
                      <span className="font-medium">Bitcoin Integration</span>
                      <p className="text-gray-600">
                        Support for both on-chain Bitcoin and Lightning Network payments
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-tiffany-500 mr-3 mt-1" />
                    <div>
                      <span className="font-medium">Transparency</span>
                      <p className="text-gray-600">
                        Public funding history and real-time donation tracking
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Security & Privacy</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Key Features</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Bitcoin className="h-5 w-5 text-tiffany-500" />
                    <span>Bitcoin integration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-tiffany-500" />
                    <span>Self-custody</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-tiffany-500" />
                    <span>Global reach</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Features Section */}
        <Card className="mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Features</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">Bitcoin Integration</h3>
                <p className="text-gray-600">Direct Bitcoin payments with no platform fees</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Self-Custody</h3>
                <p className="text-gray-600">You keep your keys, we keep it simple</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Transparency</h3>
                <p className="text-gray-600">Real-time tracking and public funding history</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Getting Started */}
        <Card className="mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Getting Started</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Getting Started</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Create an account</li>
                <li>Complete your profile</li>
                <li>Add your Bitcoin address</li>
                <li>Create your funding page</li>
                <li>Start receiving donations</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
