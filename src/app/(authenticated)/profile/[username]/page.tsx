'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth'
import supabase from '@/services/supabase/client'
import { User, Bitcoin, QrCode, ArrowLeft, ExternalLink, Info, Briefcase, Calendar, Edit } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

// Mock data for balance and recent transactions - replace with actual API calls
const mockBalance = {
  total_received: 1.2345,
  current_btc_price_usd: 60000,
  get total_received_usd() {
    return this.total_received * this.current_btc_price_usd;
  },
};

const mockRecentTransactions = [
  { id: '1', type: 'receive', amount: 0.5, date: '2024-07-20', from: 'Donor A' },
  { id: '2', type: 'receive', amount: 0.25, date: '2024-07-18', from: 'Donor B' },
  { id: '3', type: 'receive', amount: 0.4845, date: '2024-07-15', from: 'Donor C' },
];

export default function PublicProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user: currentUser, profile: currentUserProfile } = useAuthStore()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const username = params.username as string;
  const isOwnProfile = username === 'me' || (currentUserProfile && username === currentUserProfile.username);


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

  if (isLoading) {
    return <Loading fullScreen />
  }

  if (error) {
    return (
      <div className="py-8 px-4 text-center">
        <Card className="max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-red-500">{error}</p>
                <Button onClick={() => router.back()} className="mt-4" variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="py-8 px-4 text-center">
         <Card className="max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Profile Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p>The profile you are looking for does not exist.</p>
                 <Button onClick={() => router.back()} className="mt-4" variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </CardContent>
        </Card>
      </div>
    )
  }

  const viewingOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="py-6">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            {/* Profile Header */}
            <div className="relative">
                <div className="h-48 bg-gradient-to-r from-tiffany-500 to-tiffany-600"></div>
                <div className="absolute -bottom-16 left-8">
                    {profile.avatar_url ? (
                        <Image
                        src={profile.avatar_url}
                        alt={profile.display_name || profile.username || 'User'}
                        width={128}
                        height={128}
                        className="rounded-full object-cover border-4 border-white shadow-lg"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-16 h-16 text-gray-500" />
                        </div>
                    )}
                </div>
                {viewingOwnProfile && (
                    <Link href="/profile" legacyBehavior>
                        <Button variant="outline" className="absolute top-4 right-4 bg-white/80 hover:bg-white">
                            <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </Button>
                    </Link>
                )}
            </div>

            {/* Profile Info */}
            <div className="pt-20 px-8 pb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{profile.display_name || 'User'}</h1>
                        <p className="text-md text-gray-500">@{profile.username}</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex space-x-2">
                        {/* Add social links or other CTAs here if available in profile data */}
                    </div>
                </div>

                {profile.bio && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5 text-tiffany-600" /> Bio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Bitcoin Address & QR Code */}
                    <Card>
                        <CardHeader>
                        <CardTitle className="text-xl flex items-center"><Bitcoin className="mr-2 h-5 w-5 text-tiffany-600" /> Bitcoin Address</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        {profile.bitcoin_address ? (
                            <>
                                <div className="flex justify-center p-2 bg-gray-50 rounded-lg border">
                                    <QRCodeSVG
                                    value={`bitcoin:${profile.bitcoin_address}`}
                                    size={160} 
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="Q"
                                    className="rounded-md"
                                    />
                                </div>
                                <Input
                                    type="text"
                                    value={profile.bitcoin_address}
                                    readOnly
                                    className="w-full text-sm"
                                />
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => {
                                        if (profile.bitcoin_address) {
                                            navigator.clipboard.writeText(profile.bitcoin_address)
                                            toast.success('Bitcoin address copied to clipboard!')
                                        }
                                    }}
                                >
                                    Copy Address
                                </Button>
                            </>
                        ) : (
                            <p className="text-gray-500 text-sm">No Bitcoin address provided.</p>
                        )}
                        </CardContent>
                    </Card>

                    {/* Balance & Transactions (Placeholder) */}
                    <Card>
                        <CardHeader>
                        <CardTitle className="text-xl flex items-center"><QrCode className="mr-2 h-5 w-5 text-tiffany-600" /> Funding Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700">Total Received</h3>
                                <p className="text-2xl font-bold text-tiffany-600">{mockBalance.total_received.toFixed(4)} BTC</p>
                                <p className="text-sm text-gray-500">~ ${mockBalance.total_received_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</p>
                            </div>
                            <div>
                                <h3 className="text-md font-semibold text-gray-700 mb-2">Recent Transactions (Mock)</h3>
                                {mockRecentTransactions.length > 0 ? (
                                <ul className="space-y-2">
                                    {mockRecentTransactions.map(tx => (
                                    <li key={tx.id} className="text-sm p-2 bg-gray-50 rounded-md border flex justify-between">
                                        <span>{tx.amount} BTC <span className="text-gray-500">from {tx.from}</span></span>
                                        <span className="text-gray-500">{tx.date}</span>
                                    </li>
                                    ))}
                                </ul>
                                ) : (
                                <p className="text-gray-500 text-sm">No recent transactions.</p>
                                )}
                            </div>
                             <p className="text-xs text-gray-400 italic text-center pt-2">Balance and transaction history are illustrative and not yet functional.</p>
                        </CardContent>
                    </Card>
                </div>
                
                 <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center"><Briefcase className="mr-2 h-5 w-5 text-tiffany-600" /> Funding Pages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-500">Funding pages created by this user will be displayed here.</p>
                        {/* TODO: Fetch and display user's funding pages */}
                    </CardContent>
                </Card>

            </div>
        </div>
    </div>
  )
} 