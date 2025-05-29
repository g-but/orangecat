'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout'
import { 
  Users, 
  Bitcoin, 
  Zap, 
  MessageCircle, 
  Globe, 
  ArrowRight, 
  Check, 
  BarChart3,
  Heart,
  Target,
  Shield,
  TrendingUp,
  UserPlus,
  Network,
  Star,
  Clock
} from 'lucide-react'

export default function PeoplePage() {
  const router = useRouter()
  const { user, session } = useAuth()

  const features = [
    {
      icon: Users,
      title: 'Bitcoin Community',
      description: 'Connect with Bitcoin enthusiasts, developers, and entrepreneurs from around the world'
    },
    {
      icon: Network,
      title: 'Professional Network',
      description: 'Build meaningful professional relationships within the Bitcoin ecosystem'
    },
    {
      icon: MessageCircle,
      title: 'Skill Sharing',
      description: 'Share knowledge, find mentors, and collaborate on Bitcoin-related projects'
    },
    {
      icon: Target,
      title: 'Interest Groups',
      description: 'Join circles based on your interests: development, trading, mining, education, and more'
    },
    {
      icon: Bitcoin,
      title: 'Bitcoin-Native',
      description: 'Tip, pay, and transact with your network using Bitcoin and Lightning Network'
    },
    {
      icon: Shield,
      title: 'Trust & Reputation',
      description: 'Build your reputation through verified contributions and community endorsements'
    }
  ]

  const useCases = [
    {
      category: 'Developers',
      examples: ['Open Source Projects', 'Code Reviews', 'Technical Mentorship', 'Hackathon Teams']
    },
    {
      category: 'Entrepreneurs',
      examples: ['Startup Networking', 'Investor Connections', 'Business Partnerships', 'Market Insights']
    },
    {
      category: 'Educators',
      examples: ['Bitcoin Education', 'Course Creation', 'Workshop Hosting', 'Knowledge Sharing']
    },
    {
      category: 'Community',
      examples: ['Local Meetups', 'Study Groups', 'Social Events', 'Support Networks']
    }
  ]

  const benefits = [
    'Connect with verified Bitcoin community members',
    'Find mentors and collaborators for your projects',
    'Join interest-based circles and discussion groups',
    'Build your reputation through community contributions',
    'Discover opportunities in the Bitcoin ecosystem',
    'Tip and reward valuable contributions with Bitcoin'
  ]

  const handleGetStarted = () => {
    if (session) {
      router.push('/profile/setup')
    } else {
      router.push('/auth?mode=login&redirect=/profile/setup')
    }
  }

  const handleJoinWaitlist = () => {
    router.push('/coming-soon?feature=people')
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <PageHeader
        title="Bitcoin People & Networking"
        description="Connect, collaborate, and build relationships within the global Bitcoin community. Find your tribe and grow together."
      />

      {/* Coming Soon Banner */}
      <PageSection>
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-purple-600 mr-3" />
            <span className="text-2xl font-bold text-purple-800">Coming Q2 2026</span>
          </div>
          <p className="text-purple-700 text-lg mb-6">
            The Bitcoin social network is being built. Join our waitlist to connect with the community from day one!
          </p>
          <Button 
            onClick={handleJoinWaitlist}
            size="lg" 
            className="bg-purple-600 hover:bg-purple-700"
          >
            Join the Waitlist
          </Button>
        </Card>
      </PageSection>

      {/* Key Features */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-12">Why Bitcoin Networking?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center">
              <feature.icon className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Use Cases */}
      <PageSection background="tiffany">
        <h2 className="text-3xl font-bold text-center mb-12">Who Can You Connect With?</h2>
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
            <h2 className="text-3xl font-bold mb-6">Build Your Bitcoin Network</h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <UserPlus className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Global</div>
              <div className="text-sm text-gray-600">Community</div>
            </Card>
            <Card className="p-6 text-center">
              <Bitcoin className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Bitcoin</div>
              <div className="text-sm text-gray-600">Native</div>
            </Card>
            <Card className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Real-time</div>
              <div className="text-sm text-gray-600">Messaging</div>
            </Card>
            <Card className="p-6 text-center">
              <Shield className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Verified</div>
              <div className="text-sm text-gray-600">Profiles</div>
            </Card>
          </div>
        </div>
      </PageSection>

      {/* How It Works */}
      <PageSection background="gray">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Create Your Profile</h3>
            <p className="text-gray-600">Build your Bitcoin profile with skills, interests, and contributions</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Find Your Tribe</h3>
            <p className="text-gray-600">Discover people with shared interests and join relevant circles</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Connect & Collaborate</h3>
            <p className="text-gray-600">Build relationships, share knowledge, and work on projects together</p>
          </div>
        </div>
      </PageSection>

      {/* CTA Section */}
      <PageSection>
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Connect?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the most vibrant Bitcoin community. Connect with like-minded individuals, share knowledge, 
            and build the future together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleJoinWaitlist}
              size="lg" 
              className="bg-purple-600 hover:bg-purple-700"
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