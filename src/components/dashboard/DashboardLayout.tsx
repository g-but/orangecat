import { useProfile } from '@/contexts/ProfileContext'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Copy, Edit, Share2 } from 'lucide-react'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { profile, loading } = useProfile()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/create-profile')
    }
  }, [loading, profile, router])

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tiffany-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
              {profile.bio && <p className="mt-1 text-gray-600">{profile.bio}</p>}
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => router.push('/edit-profile')}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" onClick={() => {/* TODO: Implement share */}}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Donation Addresses */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.bitcoin_address && (
              <Card>
                <h3 className="text-lg font-medium text-gray-900">Bitcoin Address</h3>
                <div className="mt-2 flex items-center">
                  <code className="text-sm bg-gray-100 p-2 rounded">{profile.bitcoin_address}</code>
                  <Button variant="outline" className="ml-2 p-2" onClick={() => {/* TODO: Implement copy */}}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}
            {profile.lightning_address && (
              <Card>
                <h3 className="text-lg font-medium text-gray-900">Lightning Address</h3>
                <div className="mt-2 flex items-center">
                  <code className="text-sm bg-gray-100 p-2 rounded">{profile.lightning_address}</code>
                  <Button variant="outline" className="ml-2 p-2" onClick={() => {/* TODO: Implement copy */}}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats */}
          <div className="lg:col-span-1">
            <Card title="Donation Stats">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Donations</p>
                  <p className="text-2xl font-bold">0 sats</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Donation</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-2">
            <Card title="Recent Activity">
              <div className="text-center text-gray-500 py-8">
                No recent activity
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 