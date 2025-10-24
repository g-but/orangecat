'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout'
import { 
  Calendar, 
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
  Ticket,
  MapPin,
  Star,
  Clock
} from 'lucide-react'

export default function EventsPage() {
  const router = useRouter()
  const { user, session } = useAuth()

  const features = [
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Create, manage, and promote events with built-in ticketing and Bitcoin payments'
    },
    {
      icon: Bitcoin,
      title: 'Bitcoin Ticketing',
      description: 'Sell tickets and accept payments in Bitcoin with instant, global transactions'
    },
    {
      icon: Users,
      title: 'Community Building',
      description: 'Connect Bitcoin enthusiasts and build lasting communities around shared interests'
    },
    {
      icon: BarChart3,
      title: 'Event Analytics',
      description: 'Track attendance, revenue, and engagement with comprehensive event insights'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Transparent, secure Bitcoin transactions with automatic refund capabilities'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Host virtual or physical events and reach Bitcoin communities worldwide'
    }
  ]

  const useCases = [
    {
      category: 'Bitcoin Conferences',
      examples: ['Technical Conferences', 'Investment Summits', 'Developer Meetups', 'Educational Workshops']
    },
    {
      category: 'Community Events',
      examples: ['Local Meetups', 'Networking Events', 'Social Gatherings', 'Study Groups']
    },
    {
      category: 'Educational Events',
      examples: ['Bitcoin Courses', 'Trading Workshops', 'Technical Training', 'Beginner Sessions']
    },
    {
      category: 'Entertainment',
      examples: ['Bitcoin Parties', 'Gaming Tournaments', 'Art Exhibitions', 'Music Events']
    }
  ]

  const benefits = [
    'Accept Bitcoin payments for tickets and merchandise',
    'No traditional payment processor fees',
    'Global accessibility for international attendees',
    'Transparent blockchain-based transactions',
    'Built-in fundraising for event expenses',
    'Real-time analytics and attendee insights'
  ]

  const handleGetStarted = () => {
    if (session) {
      router.push('/projects/create')
    } else {
      router.push('/auth?mode=login&redirect=/projects/create')
    }
  }

  const handleJoinWaitlist = () => {
    router.push('/coming-soon?feature=events')
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <PageHeader
        title="Bitcoin-Powered Events"
        description="Create, manage, and monetize events with Bitcoin payments. From conferences to meetups, build your community with sound money."
      />

      {/* Coming Soon Banner */}
      <PageSection>
        <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200 p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-blue-600 mr-3" />
            <span className="text-2xl font-bold text-blue-800">Coming Q2 2026</span>
          </div>
          <p className="text-blue-700 text-lg mb-6">
            The future of event management is being built on Bitcoin. Join our waitlist to be among the first event organizers!
          </p>
          <Button 
            onClick={handleJoinWaitlist}
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Join the Waitlist
          </Button>
        </Card>
      </PageSection>

      {/* Key Features */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-12">Why Bitcoin Events?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center">
              <feature.icon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Use Cases */}
      <PageSection background="tiffany">
        <h2 className="text-3xl font-bold text-center mb-12">What Events Can You Host?</h2>
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
            <h2 className="text-3xl font-bold mb-6">Revolutionize Event Management</h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <Ticket className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Instant</div>
              <div className="text-sm text-gray-600">Ticket Sales</div>
            </Card>
            <Card className="p-6 text-center">
              <Bitcoin className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">0%</div>
              <div className="text-sm text-gray-600">Payment Fees</div>
            </Card>
            <Card className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Global</div>
              <div className="text-sm text-gray-600">Audience</div>
            </Card>
            <Card className="p-6 text-center">
              <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Real-time</div>
              <div className="text-sm text-gray-600">Analytics</div>
            </Card>
          </div>
        </div>
      </PageSection>

      {/* How It Works */}
      <PageSection background="gray">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Create Your Event</h3>
            <p className="text-gray-600">Set up event details, pricing, and Bitcoin payment options</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Promote & Sell</h3>
            <p className="text-gray-600">Share your event and sell tickets to the Bitcoin community</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Host & Earn</h3>
            <p className="text-gray-600">Manage attendees and receive Bitcoin payments instantly</p>
          </div>
        </div>
      </PageSection>

      {/* CTA Section */}
      <PageSection>
        <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200 p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Host Bitcoin Events?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the revolution in event management. Create memorable experiences while building the Bitcoin community 
            and earning sound money.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleJoinWaitlist}
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
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
