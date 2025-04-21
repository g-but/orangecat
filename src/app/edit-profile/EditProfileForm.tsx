'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { ProfileFormData, PasswordFormData } from '@/types/database'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Settings, User, Loader2, Save } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'account' | 'profile'

export default function EditProfileForm() {
  const { user } = useAuth()
  const { profile, loading, error: profileError, updateProfile, updatePassword, refreshProfile } = useProfile()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: profile?.display_name || '',
    website: profile?.website || '',
    bio: profile?.bio || '',
    bitcoin_address: profile?.bitcoin_address || ''
  })
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        website: profile.website || '',
        bio: profile.bio || '',
        bitcoin_address: profile.bitcoin_address || ''
      })
    }
  }, [profile])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (!user?.id) {
        throw new Error('User ID is missing. Please try logging in again.')
      }

      const result = await updateProfile(formData)
      if (!result.success && result.error) {
        setError(result.error)
      } else {
        // Refresh the profile data after successful update
        await refreshProfile()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await updatePassword(passwordData)
    if (!result.success && result.error) {
      setError(result.error)
    } else {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }
    setIsSubmitting(false)
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (activeTab === 'profile') {
        handleProfileSubmit(e as unknown as React.FormEvent)
      } else if (activeTab === 'account') {
        handlePasswordSubmit(e as unknown as React.FormEvent)
      }
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50" onKeyDown={handleKeyDown}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sticky Sidebar */}
          <div className="w-full md:w-64 md:sticky md:top-28 md:self-start">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => setActiveTab('account')}
                className={clsx(
                  'w-full flex items-center px-4 py-3 text-sm font-medium transition-all duration-200',
                  activeTab === 'account'
                    ? 'bg-tiffany-50 text-tiffany-700 border-l-4 border-tiffany-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-tiffany-600'
                )}
              >
                <Settings className="w-5 h-5 mr-3" />
                Account Settings
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={clsx(
                  'w-full flex items-center px-4 py-3 text-sm font-medium transition-all duration-200',
                  activeTab === 'profile'
                    ? 'bg-tiffany-50 text-tiffany-700 border-l-4 border-tiffany-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-tiffany-600'
                )}
              >
                <User className="w-5 h-5 mr-3" />
                Profile Information
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {activeTab === 'account' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
                  
                  {/* Email Display */}
                  <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Email Address</div>
                    <div className="mt-1 text-gray-900">{user?.email}</div>
                    <p className="mt-1 text-sm text-gray-500">
                      Your email address is used for account identification and cannot be changed.
                    </p>
                  </div>

                  {/* Password Form */}
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                    <div className="space-y-4">
                      <Input
                        label="Current Password"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <Input
                        label="New Password"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                      <Input
                        label="Confirm New Password"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                        className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className={clsx(
                          'px-6 py-3 rounded-xl font-medium transition-all duration-200',
                          'bg-tiffany-100 text-tiffany-700 hover:bg-tiffany-200',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          'flex items-center justify-center gap-2',
                          'shadow-sm hover:shadow-md active:shadow-sm',
                          'transform hover:-translate-y-0.5 active:translate-y-0',
                          'border border-tiffany-200 hover:border-tiffany-300'
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Update Password
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <Input
                        label="Display Name"
                        name="display_name"
                        value={formData.display_name}
                        onChange={handleProfileChange}
                        placeholder="Enter your display name"
                      />
                      <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleTextareaChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
                          rows={4}
                          placeholder="Describe your project or organization"
                        />
                      </div>
                      <Input
                        label="Website"
                        name="website"
                        value={formData.website}
                        onChange={handleProfileChange}
                        placeholder="https://your-website.com"
                      />
                      <Input
                        label="Bitcoin Address"
                        name="bitcoin_address"
                        value={formData.bitcoin_address}
                        onChange={handleProfileChange}
                        placeholder="Your Bitcoin address"
                      />
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFormData({ display_name: '', bio: '', website: '', bitcoin_address: '' })}
                        className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className={clsx(
                          'px-6 py-3 rounded-xl font-medium transition-all duration-200',
                          'bg-tiffany-100 text-tiffany-700 hover:bg-tiffany-200',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          'flex items-center justify-center gap-2',
                          'shadow-sm hover:shadow-md active:shadow-sm',
                          'transform hover:-translate-y-0.5 active:translate-y-0',
                          'border border-tiffany-200 hover:border-tiffany-300'
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {(error || profileError) && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error updating profile</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error || profileError}</p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 