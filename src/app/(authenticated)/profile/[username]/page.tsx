'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth'
import supabase from '@/services/supabase/client'
import { 
  User, 
  Bitcoin, 
  QrCode, 
  ArrowLeft, 
  ExternalLink, 
  Info, 
  Briefcase, 
  Calendar, 
  Edit,
  MapPin,
  Globe,
  Twitter,
  Github,
  Heart,
  Copy,
  Eye,
  Zap
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'
import { useBitcoinWallet } from '@/hooks/useBitcoinWallet'
import { getTransactionUrl } from '@/services/bitcoin'
import DefaultAvatar from '@/components/ui/DefaultAvatar'
import { sanitizeBioForDisplay } from '@/utils/validation'

// Get Mempool.space address URL
const getAddressUrl = (address: string): string => {
  return `https://mempool.space/address/${address}`
}

// Format Bitcoin amount
const formatBitcoinAmount = (amount: number) => {
  return amount.toFixed(8)
}

export default function PublicProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user: currentUser, profile: currentUserProfile } = useAuthStore()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const username = params.username as string;
  const isOwnProfile = username === 'me' || (currentUserProfile && username === currentUserProfile.username);

  // Use Bitcoin wallet hook for transaction data
  const { walletData, isLoading: walletLoading } = useBitcoinWallet(
    profile?.bitcoin_address || ''
  )

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true)
      setError(null)

      let profileToFetch = username;
      if (username === 'me') {
        if (currentUserProfile) {
          setProfile(currentUserProfile)
          setIsLoading(false)
          return;
        } else if (currentUser) {
            const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()
            if (fetchError) {
                console.error('Error fetching own profile by ID:', fetchError)
                setError('Could not load your profile. Please try again.')
                setProfile(null)
            } else {
                setProfile(data)
            }
            setIsLoading(false)
            return;
        } else {
            toast.error('You need to be logged in to view your profile.')
            router.push('/auth')
            setIsLoading(false)
            return;
        }
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', profileToFetch)
        .single()

      if (fetchError) {
        console.error('Error fetching profile:', fetchError)
        setError('Profile not found or an error occurred.')
        setProfile(null)
      } else {
        setProfile(data)
      }
      setIsLoading(false)
    }

    if (username) {
      fetchProfileData()
    }
  }, [username, currentUser, currentUserProfile, router])

  const copyBitcoinAddress = () => {
    if (profile?.bitcoin_address) {
      navigator.clipboard.writeText(profile.bitcoin_address)
      toast.success('Bitcoin address copied to clipboard!')
    }
  }

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
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
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

  const viewingOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative mb-8">
          <div className="h-64 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-2xl shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>
          
          {/* Profile Avatar */}
          <div className="absolute -bottom-16 left-8">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name || profile.username || 'User'}
                width={128}
                height={128}
                className="rounded-2xl object-cover border-4 border-white shadow-2xl"
              />
            ) : (
              <DefaultAvatar 
                size={128} 
                className="rounded-2xl border-4 border-white shadow-2xl" 
              />
            )}
          </div>
          
          {/* Edit Button */}
          {viewingOwnProfile && (
            <div className="absolute top-6 right-6">
              <Link href="/profile">
                <Button variant="outline" className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg">
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-20">
          {/* Left Column - Main Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Name and Basic Info */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      {profile.display_name || 'User'}
                    </h1>
                    <p className="text-lg text-orange-600 font-medium mb-4">
                      @{profile.username}
                    </p>
                    {profile.bio && (
                      <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
                        {sanitizeBioForDisplay(profile.bio)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full">
                      <Bitcoin className="w-5 h-5 text-orange-600" />
                      <span className="text-orange-800 font-medium">Bitcoin User</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bitcoin Wallet Overview */}
            {profile.bitcoin_address && (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Bitcoin className="w-6 h-6 text-orange-600" />
                    Bitcoin Wallet
                  </CardTitle>
                  <CardDescription className="text-base">
                    On-chain activity and balance information
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Balance */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-900">Current Balance</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getAddressUrl(profile.bitcoin_address!), '_blank')}
                          className="text-orange-600 hover:bg-orange-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      {walletLoading ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-orange-200 rounded mb-2"></div>
                          <div className="h-4 bg-orange-200 rounded w-24"></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-3xl font-bold text-orange-600 mb-2">
                            ₿{formatBitcoinAmount(walletData?.balance || 0)}
                          </p>
                          <p className="text-sm text-orange-700">
                            {walletData?.transactions?.length || 0} transactions
                          </p>
                        </>
                      )}
                    </div>

                    {/* QR Code */}
                    <div className="text-center">
                      <div className="inline-block p-4 bg-white rounded-2xl shadow-lg">
                        <QRCodeSVG
                          value={`bitcoin:${profile.bitcoin_address}`}
                          size={140}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          level="Q"
                          className="rounded-lg"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-3">Scan to send Bitcoin</p>
                    </div>
                  </div>

                  {/* Bitcoin Address */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 mb-1">Bitcoin Address</p>
                        <p className="text-xs font-mono text-gray-600 break-all">
                          {profile.bitcoin_address}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyBitcoinAddress}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getAddressUrl(profile.bitcoin_address!), '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Mempool
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            {profile.bitcoin_address && walletData?.transactions && walletData.transactions.length > 0 && (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-6 h-6 text-orange-600" />
                      Recent Transactions
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getAddressUrl(profile.bitcoin_address!), '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {walletData.transactions.slice(0, 3).map((tx) => (
                      <div
                        key={tx.txid}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => window.open(getTransactionUrl(tx.txid), '_blank')}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${tx.type === 'incoming' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {tx.type === 'incoming' ? (
                              <Bitcoin className="w-5 h-5 text-green-600" />
                            ) : (
                              <Bitcoin className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {tx.type === 'incoming' ? 'Received' : 'Sent'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${tx.type === 'incoming' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'incoming' ? '+' : '-'}₿{formatBitcoinAmount(tx.value)}
                          </p>
                          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {!viewingOwnProfile && profile.bitcoin_address && (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6 text-center">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-orange-100" />
                  <h3 className="text-xl font-bold mb-2">Support {profile.display_name}</h3>
                  <p className="text-orange-100 mb-4">Send Bitcoin directly to their wallet</p>
                  <Button
                    variant="outline"
                    className="bg-white text-orange-600 hover:bg-orange-50 w-full"
                    onClick={() => window.open(`bitcoin:${profile.bitcoin_address}`, '_blank')}
                  >
                    <Bitcoin className="w-4 h-4 mr-2" />
                    Send Bitcoin
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Profile Stats */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gray-600" />
                  Profile Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                  {profile.bitcoin_address && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Transactions</span>
                      <span className="font-medium">
                        {walletData?.transactions?.length || 0}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Profile Type</span>
                    <span className="font-medium text-orange-600">Bitcoin User</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Funding Pages */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-600" />
                  Funding Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-4">
                  No funding pages created yet
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 