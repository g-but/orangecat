'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/contexts/ProfileContext'
import { createProfile } from '@/lib/supabase/profile'
import { useProfileForm } from '@/hooks/useProfileForm'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export function CreateProfileForm() {
  const router = useRouter()
  const { user } = useAuth()
  const { refreshProfile } = useProfile()
  const {
    formData,
    errors,
    loading,
    error,
    handleChange,
    validateForm,
    setLoading,
    setError
  } = useProfileForm()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user) return

    try {
      setLoading(true)
      setError(null)

      await createProfile({
        user_id: user.id,
        ...formData
      })

      await refreshProfile()
      router.push('/dashboard')
    } catch (err) {
      console.error('Error creating profile:', err)
      setError('Failed to create profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Create Your Profile" subtitle="Set up your profile to start accepting Bitcoin donations">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          error={errors.full_name}
          required
        />

        <Input
          label="Bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          type="textarea"
        />

        <Input
          label="Website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          type="url"
          error={errors.website}
        />

        <Input
          label="Bitcoin Address"
          name="bitcoin_address"
          value={formData.bitcoin_address}
          onChange={handleChange}
          error={errors.bitcoin_address}
          placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        />

        <Input
          label="Lightning Address"
          name="lightning_address"
          value={formData.lightning_address}
          onChange={handleChange}
          error={errors.lightning_address}
          placeholder="yourname@getalby.com"
        />

        <Button
          type="submit"
          isLoading={loading}
          disabled={loading}
        >
          Create Profile
        </Button>
      </form>
    </Card>
  )
} 