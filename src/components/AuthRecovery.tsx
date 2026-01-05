'use client'

import { useState } from 'react'
import { AlertCircle, RefreshCw, Mail, Key, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { signOut as authSignOut, resetPassword } from '@/services/supabase/auth'

interface AuthRecoveryProps {
  error: string
  email?: string
  onRetry: () => void
  onClearError: () => void
}

export default function AuthRecovery({ error, email, onRetry, onClearError }: AuthRecoveryProps) {
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState<'idle' | 'clearing' | 'resetting' | 'success'>('idle')
  const [recoveryMessage, setRecoveryMessage] = useState('')

  const isInvalidCredentials = error.toLowerCase().includes('invalid') || error.toLowerCase().includes('credentials')
  const isUserExists = error.toLowerCase().includes('already registered') || error.toLowerCase().includes('already exists')
  const isNetworkError = error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')
  const isTimeout = error.toLowerCase().includes('timeout') || error.toLowerCase().includes('timed out')

  const handleClearAuthState = async () => {
    setIsRecovering(true)
    setRecoveryStep('clearing')
    setRecoveryMessage('Clearing authentication state...')

    try {
      // Clear all local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear cookies
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        })
      }

      // Sign out using centralized auth service
      await authSignOut()

      setRecoveryStep('success')
      setRecoveryMessage('Authentication state cleared successfully! Please try logging in again.')
      
      setTimeout(() => {
        onClearError()
        window.location.reload()
      }, 2000)

    } catch (error) {
      setRecoveryMessage('Failed to clear authentication state. Please refresh the page manually.')
    } finally {
      setIsRecovering(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setRecoveryMessage('Please enter your email address first')
      return
    }

    setIsRecovering(true)
    setRecoveryStep('resetting')
    setRecoveryMessage('Sending password reset email...')

    try {
      // Use centralized auth service instead of direct Supabase call
      const { error } = await resetPassword({ email })

      if (error) {
        setRecoveryMessage(`Failed to send reset email: ${error.message}`)
      } else {
        setRecoveryStep('success')
        setRecoveryMessage('Password reset email sent! Check your inbox and follow the instructions.')
      }
    } catch (error) {
      setRecoveryMessage('Failed to send password reset email. Please try again.')
    } finally {
      setIsRecovering(false)
    }
  }

  const getSuggestions = () => {
    if (isInvalidCredentials) {
      return [
        'Double-check your email address for typos',
        'Verify your password is correct',
        'Try using the "Forgot Password" option if you\'re unsure',
        'Make sure Caps Lock is not enabled'
      ]
    }

    if (isUserExists) {
      return [
        'Use the "Sign In" tab instead of "Register"',
        'If you forgot your password, use the password reset option',
        'Check if you already have an account with this email'
      ]
    }

    if (isNetworkError || isTimeout) {
      return [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again',
        'Disable any VPN or proxy services temporarily'
      ]
    }

    return [
      'Try refreshing the page',
      'Clear your browser cache and cookies',
      'Try using an incognito/private browsing window',
      'Contact support if the problem persists'
    ]
  }

  const getRecoveryActions = () => {
    if (isInvalidCredentials) {
      return (
        <div className="space-y-3">
          <Button
            onClick={handlePasswordReset}
            variant="secondary"
            className="w-full"
            disabled={isRecovering || !email}
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Password Reset Email
          </Button>
          <Button
            onClick={handleClearAuthState}
            variant="outline"
            className="w-full"
            disabled={isRecovering}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Auth State & Retry
          </Button>
        </div>
      )
    }

    if (isNetworkError || isTimeout) {
      return (
        <Button
          onClick={onRetry}
          variant="primary"
          className="w-full"
          disabled={isRecovering}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )
    }

    return (
      <div className="space-y-3">
        <Button
          onClick={onRetry}
          variant="primary"
          className="w-full"
          disabled={isRecovering}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={handleClearAuthState}
          variant="outline"
          className="w-full"
          disabled={isRecovering}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Clear Auth State
        </Button>
      </div>
    )
  }

  return (
    <Card className="max-w-md mx-auto mt-6 p-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Authentication Issue
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          {error}
        </p>

        {recoveryMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            recoveryStep === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <div className="flex items-center">
              {recoveryStep === 'success' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <RefreshCw className={`w-4 h-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
              )}
              <span className="text-sm">{recoveryMessage}</span>
            </div>
          </div>
        )}

        <div className="text-left mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Suggestions:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {getSuggestions().map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-tiffany-500 mr-2">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {getRecoveryActions()}

        <button
          onClick={onClearError}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
          disabled={isRecovering}
        >
          Dismiss
        </button>
      </div>
    </Card>
  )
} 