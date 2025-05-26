'use client'

import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Clock,
  Star,
  CheckCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export interface FeatureInfo {
  title: string
  icon: LucideIcon
  color: string
  iconColor: string
  description: string
  longDescription: string
  features: string[]
  timeline: string
  useCases: string[]
  landingPageUrl: string // New: URL to the main feature page
}

interface ComingSoonPageProps {
  featureInfo: FeatureInfo
  isAuthenticated: boolean
}

export default function ComingSoonPage({ featureInfo, isAuthenticated }: ComingSoonPageProps) {
  const IconComponent = featureInfo.icon
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href={isAuthenticated ? "/dashboard" : "/"}>
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {isAuthenticated ? 'Dashboard' : 'Home'}
            </Button>
          </Link>
          
          <div className="flex items-center mb-6">
            <div className={`p-4 rounded-xl bg-gradient-to-r ${featureInfo.color} mr-6`}>
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center mb-2">
                <h1 className="text-4xl font-bold text-gray-900 mr-4">{featureInfo.title}</h1>
                <span className="px-3 py-1 text-sm font-semibold bg-orange-100 text-orange-700 rounded-full">
                  Coming {featureInfo.timeline}
                </span>
              </div>
              <p className="text-xl text-gray-600">{featureInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Feature Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Description */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>What&apos;s Coming</CardTitle>
                <CardDescription>
                  Discover the powerful features being built for {featureInfo.title.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6 leading-relaxed">{featureInfo.longDescription}</p>
                
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Key Features
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {featureInfo.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-600" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2">{featureInfo.timeline}</div>
                  <p className="text-gray-600 text-sm">Expected release</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-blue-600" />
                  Use Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {featureInfo.useCases.map((useCase, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">{useCase}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Preview Card */}
            <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-600">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Preview Available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  Want to see what {featureInfo.title.toLowerCase()} will look like? 
                  Check out our detailed concept page.
                </p>
                <Link href={featureInfo.landingPageUrl}>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Concept
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Call to Action Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stay Updated Card */}
          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Stay Updated</h3>
              <p className="text-gray-700 mb-4 text-sm">
                Want to be notified when {featureInfo.title.toLowerCase()} launches? 
                {isAuthenticated ? ' You\'ll be notified automatically as a registered user.' : ' Create an account to stay in the loop.'}
              </p>
              {!isAuthenticated ? (
                <Link href="/auth">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                    Create Account
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to Dashboard
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Learn More Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Learn More</h3>
              <p className="text-gray-700 mb-4 text-sm">
                Explore our detailed vision and see how {featureInfo.title.toLowerCase()} will transform 
                your Bitcoin experience.
              </p>
              <Link href={featureInfo.landingPageUrl}>
                <Button variant="outline" className="w-full border-blue-300 hover:border-blue-400 hover:bg-blue-50">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Explore {featureInfo.title}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Part of the OrangeCat platform roadmap
            </div>
            <div className="flex gap-3">
              <Link href={isAuthenticated ? "/dashboard" : "/"}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  {isAuthenticated ? 'Dashboard' : 'Home'}
                </Button>
              </Link>
              <Link href={featureInfo.landingPageUrl}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Learn More
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 