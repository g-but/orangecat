'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { createBrowserClient } from '@supabase/ssr'
import { PasswordFormData } from '@/types/database'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import { Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react'

interface SettingsFormData extends PasswordFormData {
  email: string;
}

export default function SettingsPage() {
  const { user, clear: clearAuthStore } = useAuthStore()
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

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email! }))
    }
  }, [user?.email])

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
      if (error) throw error
      toast.success('Confirmation email sent! Please check your inbox to verify the new email address.')
    } catch (error: any) {
      console.error('Error updating email:', error)
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
    if (!formData.newPassword) {
      toast.error('New password field is required.')
      setIsSubmittingPassword(false)
      return
    }
    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.')
      setIsSubmittingPassword(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })
      
      if (error) {
        console.error('Supabase password update error:', error)
        toast.error(error.message || 'Failed to update password. Please try again.')
      } else {
        toast.success('Password updated successfully!')
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      }
    } catch (error: any) {
      console.error("Password update submission error:", error)
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
      'Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be lost.'
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      // IMPORTANT: Calling admin functions like deleteUser from the client-side is a security risk.
      // This should be moved to a secure server-side Supabase Edge Function.
      // For now, proceeding with the existing logic from the old file for demonstration.
      
      // 1. Attempt to delete user profile data (if any) from 'profiles' table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows found, not an error here
        console.error('Error deleting profile data:', profileError)
        // Do not throw yet, try to delete auth user anyway
      }

      // 2. Call a server-side function to delete the auth user
      // This is a placeholder for how it *should* be done.
      // The actual implementation requires a Supabase Edge Function.
      const response = await fetch('/api/delete-user', { method: 'POST' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete user account.')
      }
      
      toast.success('Account deletion process initiated. You will be signed out.')
      await supabase.auth.signOut() // Sign out the user
      clearAuthStore() // Clear local auth store
      router.push('/') // Redirect to homepage

    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error(error.message || 'Failed to delete account. Please contact support.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full py-6">
      <Card className="p-6 sm:p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-10 text-center">
          Account Settings
        </h1>

        {/* Email Settings */}
        <form onSubmit={handleEmailUpdate} className="space-y-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3">Email Address</h2>
          <Input
            label="Current Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="Enter your new email address"
            className="bg-white"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="secondary"
              isLoading={isSubmittingEmail}
              disabled={isSubmittingEmail}
              className="min-w-[150px] py-2.5"
            >
              {isSubmittingEmail ? 'Updating...' : 'Update Email'}
            </Button>
          </div>
        </form>

        {/* Password Form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3">Change Password</h2>
          <Input
            label="New Password"
            name="newPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={handleInputChange}
            required
            autoComplete="new-password"
            placeholder="Enter your new password (min. 6 characters)"
            className="bg-white"
          />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            autoComplete="new-password"
            placeholder="Confirm your new password"
            className="bg-white"
          />
          <div className="flex items-center justify-start">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-gray-600 hover:text-tiffany-600 px-0"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {showPassword ? 'Hide Passwords' : 'Show Passwords'}
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingPassword}
              disabled={isSubmittingPassword}
              className="min-w-[150px] py-2.5"
            >
              {isSubmittingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="pt-8 mt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-red-600 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" /> Danger Zone
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Deleting your account is irreversible and will permanently remove all your data.
          </p>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
              disabled={isDeleting}
              className="min-w-[150px] py-2.5"
            >
              {isDeleting ? 'Deleting...' : 'Delete My Account'}
            </Button>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            <strong>Security Note:</strong> For full account deletion, this action should ideally be handled by a secure server-side function. 
            The current implementation attempts to delete profile data and then relies on a placeholder API call (`/api/delete-user`) for auth user deletion.
            A proper backend API endpoint with admin privileges is required for robust and secure user deletion.
          </p>
        </div>
      </Card>
    </div>
  )
} 