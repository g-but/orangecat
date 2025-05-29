'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout'
import { 
  Building, 
  Bitcoin, 
  Zap, 
  Users, 
  Globe, 
  ArrowRight, 
  Check, 
  BarChart3,
  Heart,
  Target,
  Shield,
  TrendingUp,
  Vote,
  Coins,
  Star,
  Clock
} from 'lucide-react'

export default function OrganizationsPage() {
  const router = useRouter()
  const { user, session } = useAuth()

  const features = [
    {
      icon: Building,
      title: 'DAO Management',
      description: 'Create and manage decentralized organizations with Bitcoin-based governance and treasury'
    },
    {
      icon: Vote,
      title: 'Bitcoin Governance',
      description: 'Make collective decisions using Bitcoin-weighted voting and transparent proposal systems'
    },
    {
      icon: Coins,
      title: 'Multi-sig Treasury',
      description: 'Secure organizational funds with multi-signature Bitcoin wallets and automated distributions'
    },
    {
      icon: Users,
      title: 'Member Management',
      description: 'Organize members with roles, permissions, and contribution tracking systems'
    },
    {
      icon: BarChart3,
      title: 'Financial Analytics',
      description: 'Track organizational finances, member contributions, and project funding in real-time'
    },
    {
      icon: Shield,
      title: 'Transparent Operations',
      description: 'All transactions and decisions recorded on Bitcoin blockchain for complete transparency'
    }
  ]

  const useCases = [
    {
      category: 'Bitcoin DAOs',
      examples: ['Investment DAOs', 'Development Collectives', 'Mining Cooperatives', 'Research Organizations']
    },
    {
      category: 'Community Groups',
      examples: ['Local Bitcoin Groups', 'Educational Societies', 'Advocacy Organizations', 'Support Networks']
    },
    {
      category: 'Business Cooperatives',
      examples: ['Worker Cooperatives', 'Buying Groups', 'Service Collectives', 'Shared Resources']
    },
    {
      category: 'Investment Clubs',
      examples: ['Bitcoin Investment Groups', 'Startup Funding', 'Real Estate Collectives', 'Asset Pools']
    }
  ]

  const benefits = [
    'Decentralized governance with Bitcoin-weighted voting',
    'Secure multi-signature treasury management',
    'Transparent financial operations on blockchain',
    'Automated member contribution tracking',
    'Global participation without geographic limits',
    'Reduced administrative overhead and costs'
  ]

  const handleGetStarted = () => {
    if (session) {
      router.push('/create')
    } else {
      router.push('/auth?mode=login&redirect=/create')
    }
  }

  const handleJoinWaitlist = () => {
    router.push('/coming-soon?feature=organizations')
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <PageHeader
        title="Bitcoin Organizations & DAOs"
        description="Build decentralized organizations with Bitcoin governance, multi-sig treasuries, and transparent operations. The future of collective action."
      />

      {/* Coming Soon Banner */}
      <PageSection>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-green-600 mr-3" />
            <span className="text-2xl font-bold text-green-800">Coming Q1 2026</span>
          </div>
          <p className="text-green-700 text-lg mb-6">
            The next evolution of organizational structure is being built on Bitcoin. Join our waitlist to pioneer the future!
          </p>
          <Button 
            onClick={handleJoinWaitlist}
            size="lg" 
            className="bg-green-600 hover:bg-green-700"
          >
            Join the Waitlist
          </Button>
        </Card>
      </PageSection>

      {/* Key Features */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-12">Why Bitcoin Organizations?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center">
              <feature.icon className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Use Cases */}
      <PageSection background="tiffany">
        <h2 className="text-3xl font-bold text-center mb-12">What Organizations Can You Build?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <Card key={index} className="p-6">
              <h3 className="text-lg font-semibold mb-4">{useCase.category}</h3>
              <ul className="text-gray-600 space-y-2">
                {useCase.examples.map((example, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="w-4 h-4 text-tiffany-500 mr-2 flex-shrink-0" />
                    {example}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Benefits Section */}
      <PageSection>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Redefine Organizational Structure</h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <Vote className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Democratic</div>
              <div className="text-sm text-gray-600">Governance</div>
            </Card>
            <Card className="p-6 text-center">
              <Bitcoin className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Multi-sig</div>
              <div className="text-sm text-gray-600">Treasury</div>
            </Card>
            <Card className="p-6 text-center">
              <Users className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Global</div>
              <div className="text-sm text-gray-600">Membership</div>
            </Card>
            <Card className="p-6 text-center">
              <Shield className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">100%</div>
              <div className="text-sm text-gray-600">Transparent</div>
            </Card>
          </div>
        </div>
      </PageSection>

      {/* How It Works */}
      <PageSection background="gray">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Create Organization</h3>
            <p className="text-gray-600">Set up governance rules, member roles, and multi-sig treasury</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Invite Members</h3>
            <p className="text-gray-600">Add members, assign roles, and establish voting weights</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Govern & Operate</h3>
            <p className="text-gray-600">Make decisions, manage funds, and execute projects collectively</p>
          </div>
        </div>
      </PageSection>

      {/* CTA Section */}
      <PageSection>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Build the Future?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the movement toward decentralized organizations. Build transparent, democratic, and efficient 
            organizations powered by Bitcoin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleJoinWaitlist}
              size="lg" 
              className="bg-green-600 hover:bg-green-700"
            >
              Join the Waitlist
            </Button>
            <Button 
              onClick={() => router.push('/fundraising')}
              variant="outline" 
              size="lg"
            >
              Explore Other Features
            </Button>
          </div>
        </Card>
      </PageSection>
    </PageLayout>
  )
} 