'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  UserPlus, 
  Wallet, 
  FileText, 
  Share2, 
  Bitcoin, 
  CheckCircle, 
  Eye,
  Shield,
  Zap,
  Users,
  Globe,
  ArrowRight,
  Sparkles,
  Heart,
  TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'

type UserRole = 'creator' | 'supporter'

export default function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState<UserRole>('creator')

  const creatorSteps = [
    {
      number: 1,
      title: 'Create Your Account',
      description: 'Sign up for free with just your email. No credit card required, no hidden fees. Your account is ready in seconds.',
      icon: UserPlus,
      color: 'bg-tiffany-500',
      details: [
        'Simple email registration',
        'Secure authentication',
        'Instant profile creation'
      ]
    },
    {
      number: 2,
      title: 'Set Up Your Bitcoin Wallet',
      description: 'Add your Bitcoin wallet address where you want to receive donations. Don\'t have one? We\'ll guide you through getting a free wallet.',
      icon: Wallet,
      color: 'bg-bitcoinOrange',
      details: [
        'Support for any Bitcoin wallet',
        'Lightning Network compatible',
        'Step-by-step wallet guide available'
      ]
    },
    {
      number: 3,
      title: 'Create Your Funding Page',
      description: 'Tell your story, add images, set your funding goal, and describe your project. Our intuitive editor makes it easy.',
      icon: FileText,
      color: 'bg-purple-500',
      details: [
        'Rich text editor with media',
        'Customizable funding goals',
        'Multiple campaign types'
      ]
    },
    {
      number: 4,
      title: 'Share & Promote',
      description: 'Share your unique page link on social media, email, or anywhere else. Track views and donations in real-time.',
      icon: Share2,
      color: 'bg-blue-500',
      details: [
        'Unique shareable URL',
        'Social media integration',
        'Real-time analytics dashboard'
      ]
    },
    {
      number: 5,
      title: 'Receive Bitcoin Directly',
      description: 'When supporters donate, Bitcoin goes directly to your wallet. No middlemen, no fees, instant settlement.',
      icon: Bitcoin,
      color: 'bg-orange-500',
      details: [
        'Direct wallet payments',
        'Zero platform fees',
        'Transparent on blockchain'
      ]
    },
    {
      number: 6,
      title: 'Build Trust & Grow',
      description: 'Update your supporters with progress reports. Build transparency and trust to grow your community.',
      icon: TrendingUp,
      color: 'bg-green-500',
      details: [
        'Post updates to supporters',
        'Show transaction transparency',
        'Build lasting relationships'
      ]
    }
  ]

  const supporterSteps = [
    {
      number: 1,
      title: 'Discover Projects',
      description: 'Browse funding pages by category, search for specific causes, or explore trending campaigns. Find projects that resonate with you.',
      icon: Globe,
      color: 'bg-blue-500',
      details: [
        'Multiple categories',
        'Search and filter tools',
        'Trending and featured campaigns'
      ]
    },
    {
      number: 2,
      title: 'Review & Verify',
      description: 'Read the project story, check creator profiles, and view transaction history. Everything is transparent on the Bitcoin blockchain.',
      icon: Eye,
      color: 'bg-purple-500',
      details: [
        'Full project details',
        'Creator verification',
        'Blockchain transparency'
      ]
    },
    {
      number: 3,
      title: 'Send Bitcoin',
      description: 'Donate any amount using Bitcoin or Lightning Network. Scan the QR code or copy the address to your wallet.',
      icon: Bitcoin,
      color: 'bg-bitcoinOrange',
      details: [
        'QR code for easy scanning',
        'Lightning for instant payments',
        'On-chain for larger amounts'
      ]
    },
    {
      number: 4,
      title: 'Track Your Impact',
      description: 'Your donation is recorded on the blockchain. Follow project updates and see how your support makes a difference.',
      icon: Heart,
      color: 'bg-red-500',
      details: [
        'Donation confirmation',
        'Project update notifications',
        'Transparent impact tracking'
      ]
    }
  ]

  const whyBitcoin = [
    {
      icon: Shield,
      title: 'Trustless & Secure',
      description: 'Bitcoin\'s blockchain ensures every transaction is permanent, transparent, and immutable. No chargebacks, no fraud.'
    },
    {
      icon: Zap,
      title: 'Fast & Borderless',
      description: 'Send and receive funds anywhere in the world, instantly with Lightning Network or within minutes on-chain.'
    },
    {
      icon: Users,
      title: 'No Middlemen',
      description: 'Direct peer-to-peer payments mean 100% of donations go to creators. No platform fees, no processing costs.'
    },
    {
      icon: Eye,
      title: 'Complete Transparency',
      description: 'Every transaction is publicly verifiable on the Bitcoin blockchain. Build trust through radical transparency.'
    }
  ]

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-tiffany-50 text-tiffany-700 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Simple, Transparent, Powerful</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-tiffany-600 to-bitcoinOrange bg-clip-text text-transparent">
            How OrangeCat Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The Bitcoin Yellow Pages for funding. Create pages, share your story, receive Bitcoin donations directly. 
            No middlemen, no fees, complete transparency.
          </p>
        </motion.div>

        {/* Role Selector */}
        <motion.div 
          className="flex justify-center mb-12"
          {...fadeInUp}
        >
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveRole('creator')}
              className={`px-8 py-3 rounded-md font-medium transition-all ${
                activeRole === 'creator'
                  ? 'bg-white text-tiffany-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              I Want to Raise Funds
            </button>
            <button
              onClick={() => setActiveRole('supporter')}
              className={`px-8 py-3 rounded-md font-medium transition-all ${
                activeRole === 'supporter'
                  ? 'bg-white text-bitcoinOrange shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              I Want to Support Projects
            </button>
          </div>
        </motion.div>

        {/* Steps Section */}
        <div className="max-w-5xl mx-auto mb-20">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            key={activeRole}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {activeRole === 'creator' ? 'Start Raising Funds in 6 Simple Steps' : 'Support Projects in 4 Easy Steps'}
          </motion.h2>

          <div className="space-y-8">
            {(activeRole === 'creator' ? creatorSteps : supporterSteps).map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="p-6 md:p-8 hover:shadow-xl transition-shadow">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Step Number & Icon */}
                      <div className="flex-shrink-0">
                        <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center text-white mb-4 md:mb-0`}>
                          <Icon className="w-8 h-8" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <span className={`${step.color} text-white text-sm font-bold px-3 py-1 rounded-full`}>
                            Step {step.number}
                          </span>
                          <h3 className="text-2xl font-bold text-gray-900 flex-1">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                          {step.description}
                        </p>
                        
                        {/* Details List */}
                        <ul className="space-y-2">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-center gap-2 text-gray-700">
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Why Bitcoin Section */}
        <motion.div 
          className="mb-20"
          {...fadeInUp}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why We Use Bitcoin</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bitcoin isn't just a payment method—it's a paradigm shift in how we think about trust, transparency, and direct support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {whyBitcoin.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="bg-tiffany-100 p-3 rounded-lg flex-shrink-0">
                        <Icon className="w-6 h-6 text-tiffany-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div 
          className="max-w-3xl mx-auto mb-20"
          {...fadeInUp}
        >
          <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
          
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Do I need to know about Bitcoin to use OrangeCat?</h3>
              <p className="text-gray-600 leading-relaxed">
                Not at all! While OrangeCat uses Bitcoin for payments, you don't need to be an expert. 
                We provide step-by-step guides for setting up a wallet and receiving Bitcoin. 
                If you can send an email, you can use OrangeCat.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">How much does it cost?</h3>
              <p className="text-gray-600 leading-relaxed">
                OrangeCat is <span className="font-semibold">completely free</span>. We charge zero platform fees. 
                100% of donations go directly to your Bitcoin wallet. The only fees you'll encounter are standard 
                Bitcoin network fees (typically just a few cents).
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Is my information secure?</h3>
              <p className="text-gray-600 leading-relaxed">
                Yes. We use enterprise-grade security, encrypted connections, and follow best practices. 
                Bitcoin transactions are secured by the blockchain itself—the most secure payment network in the world. 
                We never have access to your Bitcoin wallet.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">Can I accept regular currency too?</h3>
              <p className="text-gray-600 leading-relaxed">
                OrangeCat is Bitcoin-only by design. This ensures direct peer-to-peer payments with zero fees 
                and complete transparency. Supporters can easily convert their regular currency to Bitcoin using 
                any exchange, then donate to your campaign.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3">How do I track my donations?</h3>
              <p className="text-gray-600 leading-relaxed">
                Every Bitcoin transaction is publicly recorded on the blockchain. You can track donations in real-time 
                through your dashboard, your Bitcoin wallet, or any blockchain explorer. This provides unprecedented 
                transparency for both you and your supporters.
              </p>
            </Card>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center"
          {...fadeInUp}
        >
          <Card className="p-12 bg-gradient-to-br from-tiffany-50 via-white to-orange-50 border-2 border-tiffany-100">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join the community of creators and supporters building the future of transparent funding with Bitcoin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                href="/auth?mode=register"
                size="lg"
                className="bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white group"
              >
                Create Your Free Account
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                href="/discover"
                variant="outline"
                size="lg"
              >
                Explore Campaigns
              </Button>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              No credit card required • Free forever • Set up in minutes
            </p>
          </Card>
        </motion.div>

        {/* Additional Help */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Need more help?</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button href="/bitcoin-wallet-guide" variant="ghost">
              Bitcoin Wallet Guide
            </Button>
            <Button href="/docs" variant="ghost">
              Documentation
            </Button>
            <Button href="/about" variant="ghost">
              About OrangeCat
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

