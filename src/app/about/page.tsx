'use client';

import Card from '@/components/ui/Card';
import { Bitcoin, Zap, Shield, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About OrangeCat</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering creators and innovators with Bitcoin funding
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Mission Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
            <Card className="p-8">
              <p className="text-lg text-gray-600 mb-4">
                OrangeCat is dedicated to making Bitcoin funding accessible to everyone. We believe that anyone with a great idea or project should be able to receive funding directly in Bitcoin, without intermediaries or restrictions.
              </p>
              <p className="text-lg text-gray-600">
                Our platform connects creators, innovators, and dreamers with the global Bitcoin community, enabling direct support for projects that matter.
              </p>
            </Card>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <Bitcoin className="w-8 h-8 text-tiffany-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bitcoin First</h3>
                <p className="text-gray-600">
                  We're committed to Bitcoin as the primary means of funding, supporting both on-chain and Lightning payments
                </p>
              </Card>
              <Card className="p-6">
                <Zap className="w-8 h-8 text-tiffany-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Innovation</h3>
                <p className="text-gray-600">
                  We continuously improve our platform to make Bitcoin funding more accessible and user-friendly
                </p>
              </Card>
              <Card className="p-6">
                <Shield className="w-8 h-8 text-tiffany-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trust</h3>
                <p className="text-gray-600">
                  We prioritize security and transparency in all our operations
                </p>
              </Card>
              <Card className="p-6">
                <Globe className="w-8 h-8 text-tiffany-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Global Community</h3>
                <p className="text-gray-600">
                  We foster a worldwide community of Bitcoin supporters and creators
                </p>
              </Card>
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Our Team</h2>
            <Card className="p-8">
              <p className="text-lg text-gray-600 mb-4">
                OrangeCat is built by a team of Bitcoin enthusiasts, developers, and entrepreneurs who are passionate about making Bitcoin funding accessible to everyone.
              </p>
              <p className="text-lg text-gray-600">
                We're committed to building the best platform for Bitcoin funding and supporting the growth of the Bitcoin ecosystem.
              </p>
            </Card>
          </div>

          {/* Contact Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
            <Card className="p-8">
              <p className="text-lg text-gray-600 mb-4">
                Have questions or want to learn more about OrangeCat? We'd love to hear from you.
              </p>
              <p className="text-lg text-gray-600">
                Email us at <a href="mailto:contact@orangecat.com" className="text-tiffany-500 hover:text-tiffany-600">contact@orangecat.com</a>
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 