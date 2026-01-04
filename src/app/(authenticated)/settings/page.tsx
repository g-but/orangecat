'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@supabase/ssr'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Loading from '@/components/Loading'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Mail,
  Lock,
  ArrowLeft
} from 'lucide-react'

interface SettingsFormData {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { user, hydrated, isLoading, signOut } = useAuth()
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [formData, setFormData] = useState<SettingsFormData>({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Initialize form data
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email! }))
    }
  }, [user?.email])

  // Show loading state while hydrating - AFTER all hooks
  if (!hydrated || isLoading) {
    return <Loading fullScreen />
  }

  // Redirect if not authenticated - AFTER all hooks
  if (!user) {
    router.push('/auth')
    return <Loading fullScreen />
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingEmail(true)
    
    if (!formData.email) {
      toast.error('Please enter a valid email address')
      setIsSubmittingEmail(false)
      return
    }
    
    try {
      const { error } = await supabase.auth.updateUser({ email: formData.email })
      if (error) {throw error}
      toast.success('Confirmation email sent! Please check your inbox.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email.')
    } finally {
      setIsSubmittingEmail(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingPassword(true)

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match.')
      setIsSubmittingPassword(false)
      return
    }
    if (!formData.newPassword || formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      setIsSubmittingPassword(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })
      
      if (error) {
        toast.error(error.message || 'Failed to update password.')
      } else {
        toast.success('Password updated successfully!')
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error("User not found.")
      return
    }
    
    const confirmed = window.confirm(
      'Are you absolutely sure you want to delete your account? This action cannot be undone.'
    )
    if (!confirmed) {return}

    setIsDeleting(true)
    try {
      const response = await fetch('/api/delete-user', { method: 'POST' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete account.')
      }
      
      toast.success('Account deleted. You will be signed out.')
      await signOut()
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="mr-4 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 mt-1">Manage your email, password, and security</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-6">
            <div className="flex items-center text-white">
              <Lock className="w-8 h-8 mr-4" />
              <div>
                <h2 className="text-2xl font-bold">Account & Security</h2>
                <p className="text-blue-100 text-sm mt-1">Manage your login credentials and account security</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-10">
            {/* Email Update */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Email Address</h3>
              <p className="text-gray-600 mb-6">
                This is the email address associated with your account. You&apos;ll receive important notifications here.
              </p>
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  icon={Mail}
                  className="max-w-md"
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> When you update your email, we&apos;ll send a confirmation link to your new address.
                  </p>
                </div>
                <div className="flex justify-start">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isSubmittingEmail}
                    className="px-6 py-2"
                  >
                    {isSubmittingEmail ? 'Updating...' : 'Update Email'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Password Update */}
            <div className="border-t border-gray-100 pt-10">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h3>
              <p className="text-gray-600 mb-6">
                Choose a strong password to keep your account secure.
              </p>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="max-w-md space-y-4">
                  <Input
                    label="New Password"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password (min. 6 characters)"
                    icon={Lock}
                  />
                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    icon={Lock}
                  />
                </div>
                
                <div className="flex items-center justify-between max-w-md">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-sm px-0"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showPassword ? 'Hide' : 'Show'} passwords
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="px-6 py-2"
                  >
                    {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-red-200 pt-10">
              <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2" /> 
                Danger Zone
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-red-800 mb-2">Delete Account</h4>
                <p className="text-sm text-red-700 mb-4">
                  This will permanently delete your account and all associated data including your profile, projects, and transaction history. This action cannot be undone.
                </p>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-6 py-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 