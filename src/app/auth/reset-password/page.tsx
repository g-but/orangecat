'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, AlertCircle, Loader2, Key } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import supabase from '@/services/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'loading' | 'reset' | 'success' | 'error'>('loading')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we have the necessary tokens from the URL
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const type = searchParams.get('type')

    if (type === 'recovery' && accessToken && refreshToken) {
      // Set the session using the tokens from the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting session:', error)
          setStep('error')
          setError('Invalid or expired reset link. Please request a new password reset.')
        } else {
          setStep('reset')
        }
      })
    } else {
      setStep('error')
      setError('Invalid reset link. Please request a new password reset from the login page.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) {
        throw error
      }

      setStep('success')
    } catch (error: any) {
      console.error('Password reset error:', error)
      setError(error.message || 'Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturnToLogin = () => {
    router.push('/auth?mode=login')
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-tiffany-50 to-white">
        <Card className="max-w-md w-full mx-4 p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-tiffany-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Verifying Reset Link
            </h2>
            <p className="mt-2 text-gray-600">
              Please wait while we verify your password reset link...
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-tiffany-50 to-white">
        <Card className="max-w-md w-full mx-4 p-8">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Reset Link Invalid
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <Button
              onClick={handleReturnToLogin}
              variant="primary"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-tiffany-50 to-white">
        <Card className="max-w-md w-full mx-4 p-8">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Password Reset Successful
            </h2>
            <p className="text-gray-600 mb-6">
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
            <Button
              onClick={handleReturnToLogin}
              variant="primary"
              className="w-full"
            >
              Sign In Now
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-tiffany-50 to-white">
      <Card className="max-w-md w-full mx-4 p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-tiffany-100 mb-4">
            <Key className="h-6 w-6 text-tiffany-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-gray-600">
            Enter your new password below
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="New password (min. 6 characters)"
              className="w-full"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center">
            <input
              id="show-password"
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 text-tiffany-600 focus:ring-tiffany-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="show-password" className="ml-2 block text-sm text-gray-900">
              Show passwords
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            variant="primary"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Updating Password...</span>
              </div>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleReturnToLogin}
            className="text-sm text-tiffany-600 hover:text-tiffany-500"
            disabled={isLoading}
          >
            Back to Login
          </button>
        </div>
      </Card>
    </div>
  )
} 