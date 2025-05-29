'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout'
import { 
  Briefcase, 
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
  GitBranch,
  Milestone,
  Star,
  Clock
} from 'lucide-react'

export default function ProjectsPage() {
  const router = useRouter()
  const { user, session } = useAuth()

  const features = [
    {
      icon: Briefcase,
      title: 'Project Management',
      description: 'Create, manage, and track projects with milestone-based funding and transparent progress'
    },
    {
      icon: Target,
      title: 'Milestone Funding',
      description: 'Release funds automatically as project milestones are completed and verified'
    },
    {
      icon: Users,
      title: 'Collaborative Workspace',
      description: 'Work with team members, contributors, and stakeholders in shared project environments'
    },
    {
      icon: Bitcoin,
      title: 'Bitcoin Escrow',
      description: 'Secure project funding with Bitcoin escrow that releases based on milestone completion'
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Monitor project progress with detailed analytics and transparent reporting'
    },
    {
      icon: Shield,
      title: 'Community Governance',
      description: 'Let the community vote on project proposals and milestone completions'
    }
  ]

  const useCases = [
    {
      category: 'Open Source',
      examples: ['Bitcoin Development', 'Lightning Tools', 'Educational Resources', 'Community Libraries']
    },
    {
      category: 'Research',
      examples: ['Bitcoin Research', 'Economic Studies', 'Technical Analysis', 'Academic Papers']
    },
    {
      category: 'Creative Works',
      examples: ['Bitcoin Art', 'Educational Content', 'Documentaries', 'Books & Writing']
    },
    {
      category: 'Community Projects',
      examples: ['Local Initiatives', 'Educational Programs', 'Infrastructure', 'Social Impact']
    }
  ]

  const benefits = [
    'Milestone-based funding ensures project completion',
    'Transparent progress tracking builds trust',
    'Bitcoin escrow protects both funders and creators',
    'Community voting validates project value',
    'Global collaboration without geographic limits',
    'Automated fund release upon milestone completion'
  ]

  const handleGetStarted = () => {
    if (session) {
      router.push('/create')
    } else {
      router.push('/auth?mode=login&redirect=/create')
    }
  }

  const handleJoinWaitlist = () => {
    router.push('/coming-soon?feature=projects')
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <PageHeader
        title="Bitcoin Project Funding"
        description="Launch and manage projects with transparent funding, milestone tracking, and community governance. Build the future with Bitcoin."
      />

      {/* Coming Soon Banner */}
      <PageSection>
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-indigo-600 mr-3" />
            <span className="text-2xl font-bold text-indigo-800">Coming Q1 2026</span>
          </div>
          <p className="text-indigo-700 text-lg mb-6">
            Revolutionary project funding is being built on Bitcoin. Join our waitlist to be among the first project creators!
          </p>
          <Button 
            onClick={handleJoinWaitlist}
            size="lg" 
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Join the Waitlist
          </Button>
        </Card>
      </PageSection>

      {/* Key Features */}
      <PageSection>
        <h2 className="text-3xl font-bold text-center mb-12">Why Bitcoin Project Funding?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center">
              <feature.icon className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Use Cases */}
      <PageSection background="tiffany">
        <h2 className="text-3xl font-bold text-center mb-12">What Projects Can You Fund?</h2>
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
            <h2 className="text-3xl font-bold mb-6">Revolutionize Project Funding</h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <Milestone className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Milestone</div>
              <div className="text-sm text-gray-600">Based</div>
            </Card>
            <Card className="p-6 text-center">
              <Bitcoin className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Bitcoin</div>
              <div className="text-sm text-gray-600">Escrow</div>
            </Card>
            <Card className="p-6 text-center">
              <Users className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">Community</div>
              <div className="text-sm text-gray-600">Governed</div>
            </Card>
            <Card className="p-6 text-center">
              <BarChart3 className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
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
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Create Project</h3>
            <p className="text-gray-600">Define your project, set milestones, and establish funding goals</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Get Funded</h3>
            <p className="text-gray-600">Community votes and funds your project with Bitcoin escrow</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Deliver & Earn</h3>
            <p className="text-gray-600">Complete milestones and receive automatic Bitcoin payments</p>
          </div>
        </div>
      </PageSection>

      {/* CTA Section */}
      <PageSection>
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Build Something Amazing?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the revolution in project funding. Create transparent, milestone-driven projects that deliver 
            real value to the Bitcoin community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleJoinWaitlist}
              size="lg" 
              className="bg-indigo-600 hover:bg-indigo-700"
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