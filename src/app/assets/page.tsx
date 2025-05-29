'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout'
import { 
  Wallet, 
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
  Package,
  Truck,
  Star,
  Clock
} from 'lucide-react'

export default function AssetsPage() {
  const router = useRouter()
  const { user, session } = useAuth()

  const features = [
    {
      icon: Wallet,
      title: 'Asset Marketplace',
      description: 'List, rent, and discover physical assets in your community with Bitcoin payments'
    },
    {
      icon: Bitcoin,
      title: 'Bitcoin Payments',
      description: 'Secure, instant Bitcoin transactions for all rental and sharing activities'
    },
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'Built-in reputation system and security deposits for safe asset sharing'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Connect with neighbors and community members to share resources efficiently'
    },
    {
      icon: BarChart3,
      title: 'Asset Tracking',
      description: 'Monitor asset condition, usage history, and earnings with detailed analytics'
    },
    {
      icon: Globe,
      title: 'Global Network',
      description: 'Access assets worldwide or focus on your local community'
    }
  ]

  const useCases = [
    {
      category: 'Tools & Equipment',
      examples: ['Power Tools', 'Garden Equipment', 'Construction Tools', 'Professional Gear']
    },
    {
      category: 'Vehicles',
      examples: ['Cars & Motorcycles', 'Bikes & Scooters', 'Boats & RVs', 'Specialty Vehicles']
    },
    {
      category: 'Spaces & Venues',
      examples: ['Event Spaces', 'Storage Units', 'Parking Spots', 'Work Spaces']
    },
    {
      category: 'Electronics',
      examples: ['Cameras & Equipment', 'Audio Gear', 'Gaming Consoles', 'Tech Gadgets']
    }
  ]

  const benefits = [
    'Earn Bitcoin by sharing your unused assets',
    'Access expensive equipment without buying',
    'Build community connections through sharing',
    'Transparent blockchain-based transactions',
    'Insurance and security deposit protection',
    'Detailed asset condition tracking'
  ]

  const handleGetStarted = () => {
    if (session) {
      router.push('/create')
    } else {
      router.push('/auth?mode=login&redirect=/create')
    }
  }

  const handleJoinWaitlist = () => {
    router.push('/coming-soon?feature=assets')
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <PageHeader
        title="Asset Sharing Marketplace"
        description="Share, rent, and discover physical assets in your community. Powered by Bitcoin for secure, instant transactions."
      />

      {/* Coming Soon Banner */}
      <PageSection>
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-orange-600 mr-3" />
            <span className="text-2xl font-bold text-orange-800">Coming Q2 2026</span>
          </div>
          <p className="text-orange-700 text-lg mb-6">
            We&apos;re building the future of community asset sharing. Join our waitlist to be the first to know when we launch!
          </p>
          <Button 
            onClick={handleJoinWaitlist}
            size="lg" 
            className="bg-orange-600 hover:bg-orange-700"
          >
            Join the Waitlist
          </Button>
        </Card>
      </PageSection>

      {/* Key Features */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-12">Why Asset Sharing with Bitcoin?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center">
              <feature.icon className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Use Cases */}
      <PageSection background="tiffany">
        <h2 className="text-3xl font-bold text-center mb-12">What Can You Share?</h2>
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
            <h2 className="text-3xl font-bold mb-6">Transform Your Community</h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <Package className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">1000+</div>
              <div className="text-sm text-gray-600">Asset Types</div>
            </Card>
            <Card className="p-6 text-center">
              <Bitcoin className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Instant</div>
              <div className="text-sm text-gray-600">Bitcoin Payments</div>
            </Card>
            <Card className="p-6 text-center">
              <Users className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Community</div>
              <div className="text-sm text-gray-600">Focused</div>
            </Card>
            <Card className="p-6 text-center">
              <Shield className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">100%</div>
              <div className="text-sm text-gray-600">Secure</div>
            </Card>
          </div>
        </div>
      </PageSection>

      {/* How It Works */}
      <PageSection background="gray">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-orange-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">List Your Assets</h3>
            <p className="text-gray-600">Upload photos, set prices, and describe your available assets</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-orange-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Connect & Rent</h3>
            <p className="text-gray-600">Browse local assets, connect with owners, and arrange rentals</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-orange-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Pay with Bitcoin</h3>
            <p className="text-gray-600">Secure payments and deposits handled automatically via Bitcoin</p>
          </div>
        </div>
      </PageSection>

      {/* CTA Section */}
      <PageSection>
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Share and Earn?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of community members who are already sharing assets and earning Bitcoin. 
            Be among the first to experience the future of community sharing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleJoinWaitlist}
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700"
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