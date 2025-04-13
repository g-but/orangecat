'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import { User, AtSign, Bitcoin } from 'lucide-react'

interface FormData {
  username: string
  display_name: string
  bitcoin_address: string
}

interface FormErrors {
  username?: string
  display_name?: string
  bitcoin_address?: string
}

export default function CreateProfileForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    username: '',
    display_name: '',
    bitcoin_address: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Only letters, numbers, underscores, and hyphens allowed'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters'
    }

    if (formData.display_name && formData.display_name.length > 50) {
      newErrors.display_name = 'Display name must be less than 50 characters'
    }

    if (formData.bitcoin_address && !/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(formData.bitcoin_address)) {
      newErrors.bitcoin_address = 'Please enter a valid Bitcoin address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: user.id,
            username: formData.username,
            display_name: formData.display_name,
            bitcoin_address: formData.bitcoin_address,
          }
        ])

      if (error) throw error

      router.push('/profile')
    } catch (err) {
      setErrors({
        ...errors,
        username: err instanceof Error ? err.message : 'Something went wrong'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card
        title="Create Your Profile"
        subtitle="Get started in just a few simple steps"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Username"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Choose a username"
            error={errors.username}
            description="This will be your unique identifier. Only letters, numbers, underscores, and hyphens allowed."
            icon={<AtSign className="w-5 h-5 text-gray-400" />}
          />

          <Input
            label="Display Name"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="How you want to be known"
            error={errors.display_name}
            description="This is how others will see you. Leave blank to use your username."
            icon={<User className="w-5 h-5 text-gray-400" />}
          />

          <Input
            label="Bitcoin Address"
            value={formData.bitcoin_address}
            onChange={(e) => setFormData({ ...formData, bitcoin_address: e.target.value })}
            placeholder="Your Bitcoin address (optional)"
            error={errors.bitcoin_address}
            description="Add your Bitcoin address to receive donations. You can add this later."
            icon={<Bitcoin className="w-5 h-5 text-gray-400" />}
          />

          <Button
            type="submit"
            isLoading={loading}
          >
            Create Profile
          </Button>
        </form>
      </Card>
    </div>
  )
} 