'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Wallet,
  Shield,
  TrendingUp,
  Globe,
  Zap,
  ExternalLink,
  ChevronRight,
  Clock,
  Target,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  lessons: number;
  href: string;
  status: 'available' | 'coming-soon';
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'video' | 'tool' | 'external';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  href: string;
  external?: boolean;
  featured?: boolean;
}

const learningPaths: LearningPath[] = [
  {
    id: 'wallets',
    title: 'Bitcoin Wallets',
    description: 'Learn how to securely store and manage your Bitcoin',
    level: 'Beginner',
    duration: '1-2 hours',
    icon: Wallet,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    lessons: 5,
    href: '/bitcoin-wallet-guide',
    status: 'available',
  },
  {
    id: 'basics',
    title: 'Bitcoin Basics',
    description: 'Start your Bitcoin journey with fundamental concepts',
    level: 'Beginner',
    duration: '2-3 hours',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    lessons: 8,
    href: '/study-bitcoin/basics',
    status: 'coming-soon',
  },
  {
    id: 'security',
    title: 'Security Best Practices',
    description: 'Protect your Bitcoin with advanced security techniques',
    level: 'Intermediate',
    duration: '3-4 hours',
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    lessons: 10,
    href: '/study-bitcoin/security',
    status: 'coming-soon',
  },
  {
    id: 'lightning',
    title: 'Lightning Network',
    description: "Understand Bitcoin's second layer for instant payments",
    level: 'Intermediate',
    duration: '2-3 hours',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    lessons: 7,
    href: '/study-bitcoin/lightning',
    status: 'coming-soon',
  },
];

const quickResources: Resource[] = [
  {
    id: 'wallet-guide',
    title: 'Bitcoin Wallet Setup Guide',
    description: 'Complete guide to choosing and setting up your first Bitcoin wallet',
    type: 'guide',
    icon: Wallet,
    href: '/bitcoin-wallet-guide',
    featured: true,
  },
  {
    id: 'bitcoin-whitepaper',
    title: 'Bitcoin Whitepaper',
    description: "Read Satoshi Nakamoto's original Bitcoin whitepaper",
    type: 'external',
    icon: BookOpen,
    href: 'https://bitcoin.org/bitcoin.pdf',
    external: true,
  },
  {
    id: 'bitcoin-org',
    title: 'Bitcoin.org',
    description: 'Official Bitcoin information and resources',
    type: 'external',
    icon: Globe,
    href: 'https://bitcoin.org',
    external: true,
  },
  {
    id: 'mempool-explorer',
    title: 'Mempool Explorer',
    description: 'Explore Bitcoin transactions and network statistics',
    type: 'tool',
    icon: TrendingUp,
    href: 'https://mempool.space',
    external: true,
  },
];

export default function StudyBitcoinPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const filteredPaths =
    selectedLevel === 'all'
      ? learningPaths
      : learningPaths.filter(path => path.level.toLowerCase() === selectedLevel);

  const featuredResources = quickResources.filter(resource => resource.featured);
  const otherResources = quickResources.filter(resource => !resource.featured);

  return (
    <PageLayout maxWidth="7xl">
      <PageHeader
        title="Study Bitcoin"
        subtitle="Your comprehensive guide to understanding Bitcoin"
        description="From basics to advanced concepts, learn everything you need to know about Bitcoin, cryptocurrency, and the future of money."
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button href="/bitcoin-wallet-guide" size="lg" className="min-h-[48px]">
            <Wallet className="w-5 h-5 mr-2" />
            Start with Wallets
          </Button>
          <Button href="#learning-paths" variant="outline" size="lg" className="min-h-[48px]">
            <BookOpen className="w-5 h-5 mr-2" />
            Browse All Topics
          </Button>
        </div>
      </PageHeader>

      {/* Featured Resources */}
      <PageSection background="white">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Featured Resources</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Start here with our most popular and essential Bitcoin education resources
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredResources.map(resource => {
            const Icon = resource.icon;
            return (
              <Card
                key={resource.id}
                className="group hover:shadow-lg transition-all duration-200 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50"
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Icon className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">{resource.description}</p>
                      <Link
                        href={resource.href}
                        className="inline-flex items-center text-orange-600 font-medium hover:text-orange-700 transition-colors"
                        {...(resource.external
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                      >
                        Get Started
                        {resource.external ? (
                          <ExternalLink className="w-4 h-4 ml-2" />
                        ) : (
                          <ArrowRight className="w-4 h-4 ml-2" />
                        )}
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* Learning Paths */}
      <PageSection>
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Learning Paths</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Structured courses designed to take you from beginner to Bitcoin expert
          </p>

          {/* Level Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {['all', 'beginner', 'intermediate', 'advanced'].map(level => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLevel === level
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPaths.map(path => {
            const Icon = path.icon;
            return (
              <Card
                key={path.id}
                className="group hover:shadow-lg transition-all duration-200 relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${path.bgColor.replace('bg-', 'bg-gradient-to-r from-').replace('-50', '-400 to-').replace('bg-gradient-to-r from-', 'bg-gradient-to-r from-').concat('-600')}`}
                />

                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 ${path.bgColor} rounded-xl flex items-center justify-center`}
                    >
                      <Icon className={`w-6 h-6 ${path.color}`} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          path.level === 'Beginner'
                            ? 'bg-green-100 text-green-700'
                            : path.level === 'Intermediate'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {path.level}
                      </span>
                      {path.status === 'coming-soon' && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {path.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{path.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {path.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {path.lessons} lessons
                    </div>
                  </div>

                  <Link
                    href={path.status === 'available' ? path.href : '#'}
                    className={`inline-flex items-center justify-center w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      path.status === 'available'
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }`}
                    {...(path.status === 'coming-soon' ? { 'aria-disabled': true } : {})}
                  >
                    {path.status === 'available' ? 'Start Learning' : 'Learn More'}
                    {path.status === 'available' && <ChevronRight className="w-4 h-4 ml-2" />}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* Quick Resources */}
      <PageSection background="gray">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Resources</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Essential tools, guides, and external resources for your Bitcoin journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherResources.map(resource => {
            const Icon = resource.icon;
            return (
              <Card key={resource.id} className="group hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      <Icon className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                        {resource.description}
                      </p>
                      <Link
                        href={resource.href}
                        className="inline-flex items-center text-sm text-orange-600 font-medium hover:text-orange-700 transition-colors"
                        {...(resource.external
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                      >
                        {resource.type === 'external' ? 'Visit' : 'Read'}
                        {resource.external ? (
                          <ExternalLink className="w-3 h-3 ml-1" />
                        ) : (
                          <ChevronRight className="w-3 h-3 ml-1" />
                        )}
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* Why Learn Bitcoin */}
      <PageSection background="white">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Learn About Bitcoin?</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Understanding Bitcoin is essential in today&apos;s digital economy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Shield,
              title: 'Financial Sovereignty',
              description: 'Take control of your money without relying on traditional banks',
            },
            {
              icon: Globe,
              title: 'Global Currency',
              description: 'Send money anywhere in the world without borders or restrictions',
            },
            {
              icon: TrendingUp,
              title: 'Investment Opportunity',
              description: 'Understand the potential of digital assets and blockchain technology',
            },
            {
              icon: Lightbulb,
              title: 'Future Technology',
              description: 'Stay ahead of the curve in the evolving digital economy',
            },
          ].map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </PageSection>

      {/* Call to Action */}
      <PageSection background="tiffany">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to Start Your Bitcoin Journey?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Begin with our comprehensive wallet guide and take your first step into the world of
            Bitcoin
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/bitcoin-wallet-guide" size="lg" className="min-h-[48px]">
              <Wallet className="w-5 h-5 mr-2" />
              Get Your First Wallet
            </Button>
            <Button href="/projects/create" variant="outline" size="lg" className="min-h-[48px]">
              <Target className="w-5 h-5 mr-2" />
              Start a Campaign
            </Button>
          </div>
        </div>
      </PageSection>
    </PageLayout>
  );
}
