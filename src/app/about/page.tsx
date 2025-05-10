'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Bitcoin, Zap, Shield, Globe, Code, Eye, GitBranch, Lock } from 'lucide-react';

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
            <h2 className="text-2xl font-bold mb-6">Our Mission: Simplifying Bitcoin Funding</h2>
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-3">The Problem We Solve</h3>
              <p className="text-lg text-gray-600 mb-4">
                Traditional funding platforms can be restrictive, involve intermediaries, and may not readily support Bitcoin. This creates barriers for creators and innovators seeking direct, peer-to-peer support through cryptocurrency.
              </p>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Our Solution</h3>
              <p className="text-lg text-gray-600 mb-4">
                OrangeCat provides a dedicated platform that directly connects creators, innovators, and organizations with a global community of Bitcoin supporters. We facilitate direct Bitcoin funding, empowering individuals and projects without unnecessary intermediaries.
              </p>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Who Benefits?</h3>
               <ul className="list-disc list-inside text-lg text-gray-600 space-y-1">
                <li><span className="font-semibold">Creators & Innovators:</span> Access direct funding in Bitcoin for your projects, ideas, and causes.</li>
                <li><span className="font-semibold">Bitcoin Supporters:</span> Discover and fund projects you believe in, fostering the Bitcoin ecosystem.</li>
                <li><span className="font-semibold">The Open Source Community:</span> We champion transparency and collaborative development.</li>
              </ul>
            </Card>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Our Principles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <Bitcoin className="w-8 h-8 text-tiffany-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bitcoin-First</h3>
                <p className="text-gray-600">
                  We're committed to Bitcoin for funding, emphasizing self-custody and no platform fees.
                </p>
              </Card>
              <Card className="p-6">
                <Code className="w-8 h-8 text-tiffany-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Open Source</h3>
                <p className="text-gray-600">
                  Our platform is built on open-source principles, fostering community collaboration and transparency.
                </p>
              </Card>
              <Card className="p-6">
                <Eye className="w-8 h-8 text-tiffany-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Transparency</h3>
                <p className="text-gray-600">
                  We operate with openness, ensuring our processes and development are clear and accessible.
                </p>
              </Card>
              <Card className="p-6">
                <GitBranch className="w-8 h-8 text-tiffany-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Decentralization</h3>
                <p className="text-gray-600">
                  We believe in empowering individuals and reducing reliance on central points of control.
                </p>
              </Card>
              <Card className="p-6">
                <Lock className="w-8 h-8 text-tiffany-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Privacy-Conscious</h3>
                <p className="text-gray-600">
                  We respect user privacy and aim to collect only necessary information to operate the platform effectively.
                </p>
              </Card>
              <Card className="p-6">
                <Zap className="w-8 h-8 text-tiffany-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Innovation</h3>
                <p className="text-gray-600">
                  We continuously improve our platform to make Bitcoin funding more accessible and user-friendly.
                </p>
              </Card>
              <Card className="p-6">
                <Shield className="w-8 h-8 text-tiffany-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trust & Security</h3>
                <p className="text-gray-600">
                  We prioritize the security of our platform and the trust of our community.
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
                We're committed to building the best platform for Bitcoin funding and supporting the growth of the Bitcoin ecosystem. We are a team of passionate developers, designers and Bitcoiners.
              </p>
            </Card>
          </div>

          {/* Call to Action Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">Ready to Dive In?</h2>
            <Card className="p-8">
              <p className="text-lg text-gray-600 mb-8 text-center">
                Whether you're looking to fund your next big idea or support innovative projects, OrangeCat is your gateway.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                <Button href="/profile" variant="primary" size="lg" className="w-full sm:w-auto">
                  Create Your Profile
                </Button>
                <Button href="/fund-others" variant="outline" size="lg" className="w-full sm:w-auto">
                  Discover Fundraisers
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 