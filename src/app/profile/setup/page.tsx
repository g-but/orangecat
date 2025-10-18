'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile'
import UnifiedProfileLayout from '@/components/profile/UnifiedProfileLayout'
import Loading from '@/components/Loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ArrowLeft, CheckCircle, Sparkles } from 'lucide-react'

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()

  // Get user email for default username
  const userEmail = user?.email
  
  const {
    profile,
    isLoading,
    error,
    isOwnProfile,
    mode,
    setMode,
    handleSave,
    refetch
  } = useUnifiedProfile({
    username: 'me',
    autoFetch: true
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [authLoading, user, router])

  // Auto-enable edit mode for setup
  useEffect(() => {
    if (profile && isOwnProfile) {
      setMode('edit')
    }
  }, [profile, isOwnProfile, setMode])

  // Show loading state while auth is being checked
  if (authLoading || isLoading) {
    return <Loading fullScreen message="Setting up your profile..." />
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto shadow-xl">
          <CardHeader className="text-center bg-red-50">
            <CardTitle className="text-red-600">Setup Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push('/auth')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
              </Button>
              <Button onClick={refetch}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto shadow-xl">
          <CardHeader className="text-center">
            <CardTitle>Profile Setup Required</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="mb-4">Unable to load your profile. Please try again.</p>
            <Button onClick={() => router.push('/auth')}>
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Enhanced save handler that redirects to dashboard after setup
  const handleSetupSave = async (data: any) => {
    try {
      await handleSave(data)
      
      // Show success message and redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (error) {
      // Error is already handled by the base handleSave function
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
      {/* Setup Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-orange-500" />
                Welcome to OrangeCat!
              </h1>
              <p className="text-gray-600 mt-1">Let's set up your profile - everything is optional</p>
            </div>
            <Button 
              onClick={() => router.push('/dashboard')} 
              variant="outline"
              className="text-sm"
            >
              Skip Setup
            </Button>
          </div>
        </div>
      </div>

      {/* Setup Tips */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Setup Tips</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Choose a username that represents you well</li>
                  <li>• Add a profile picture to make your profile more engaging</li>
                  <li>• Your Bitcoin address enables direct donations</li>
                  <li>• Everything is optional - you can always complete it later</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Profile Layout */}
      <UnifiedProfileLayout
        profile={profile}
        isOwnProfile={isOwnProfile}
        mode={mode}
        onSave={handleSetupSave}
        onModeChange={setMode}
        className="pb-16"
      />

      {/* Setup Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Button 
              onClick={() => router.push('/auth')} 
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="text-sm text-gray-500">
              Profile setup • Optional step
            </div>
            
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-orange-600 hover:bg-orange-700"
              size="sm"
            >
              Continue to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 