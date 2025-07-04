'use client'

import { useParams } from 'next/navigation'
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile'
import UnifiedProfileLayout from '@/components/profile/UnifiedProfileLayout'
import Loading from '@/components/Loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  
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
    username,
    autoFetch: true
  })

  if (isLoading) {
    return <Loading fullScreen />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto shadow-xl">
          <CardHeader className="text-center bg-red-50">
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto shadow-xl">
          <CardHeader className="text-center">
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="mb-4">The profile you are looking for does not exist.</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <UnifiedProfileLayout
      profile={profile}
      isOwnProfile={isOwnProfile}
      mode={mode}
      onSave={handleSave}
      onModeChange={setMode}
    />
  )
} 