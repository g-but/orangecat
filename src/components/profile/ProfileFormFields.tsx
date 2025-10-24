'use client'

import { Control } from 'react-hook-form'
import {
  User,
  Sparkles,
  Bitcoin,
  Zap,
  Globe
} from 'lucide-react'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { ProfileFormValues } from './ModernProfileEditor'

interface BaseFieldProps {
  control: Control<ProfileFormValues>
  name: keyof ProfileFormValues
  label: string
  placeholder: string
  description: string
  icon?: React.ReactNode
  iconColor?: string
  className?: string
}

interface TextFieldProps extends BaseFieldProps {
  type?: 'input' | 'textarea'
  maxLength?: number
  showCharCount?: boolean
}

// Reusable text field component
export function ProfileTextField({
  control,
  name,
  label,
  placeholder,
  description,
  icon,
  iconColor = "text-orange-500",
  className = "",
  type = 'input',
  maxLength,
  showCharCount = false
}: TextFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={`text-base font-semibold flex items-center gap-2 ${className}`}>
            {icon}
            {label}
          </FormLabel>
          <FormControl>
            {type === 'textarea' ? (
              <Textarea
                placeholder={placeholder}
                className="resize-none min-h-[120px] border-2 focus:border-purple-300"
                maxLength={maxLength}
                {...field}
              />
            ) : (
              <Input
                placeholder={placeholder}
                className={`text-lg border-2 ${icon ? 'pl-8' : ''} ${iconColor.includes('orange') ? 'focus:border-orange-300' : iconColor.includes('teal') ? 'focus:border-teal-300' : 'focus:border-purple-300'}`}
                maxLength={maxLength}
                {...field}
              />
            )}
          </FormControl>
          <FormDescription className={showCharCount ? "flex justify-between" : ""}>
            <span>{description}</span>
            {showCharCount && maxLength && (
              <span className={field.value?.length > (maxLength * 0.9) ? "text-orange-500 font-semibold" : ""}>
                {field.value?.length || 0}/{maxLength}
              </span>
            )}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Username field with @ prefix
export function UsernameField({ control }: { control: Control<ProfileFormValues> }) {
  return (
    <FormField
      control={control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-gray-700">
            Username *
          </FormLabel>
          <FormControl>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
              <Input
                placeholder="your_unique_username"
                className="pl-8"
                {...field}
              />
            </div>
          </FormControl>
          <FormDescription className="text-xs text-gray-500">
            Your unique @username - like on Twitter. 3-30 characters.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Display name field
export function DisplayNameField({ control }: { control: Control<ProfileFormValues> }) {
  return (
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-gray-700">
            Display Name
          </FormLabel>
          <FormControl>
            <Input
              placeholder="Your awesome display name (optional)"
              {...field}
            />
          </FormControl>
          <FormDescription className="text-xs text-gray-500">
            How others will see you (optional - leave blank to use your @username)
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Bio field
export function BioField({ control }: { control: Control<ProfileFormValues> }) {
  return (
    <FormField
      control={control}
      name="bio"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Bio
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="Tell your story... What drives you? What are you passionate about? Share your journey! 🚀"
              className="resize-none min-h-[120px] border-2 focus:border-purple-300"
              {...field}
            />
          </FormControl>
          <FormDescription className="flex justify-between">
            <span>Share your awesome story with the community!</span>
            <span className={field.value?.length > 450 ? "text-orange-500 font-semibold" : ""}>
              {field.value?.length || 0}/500
            </span>
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Bitcoin address field
export function BitcoinAddressField({ control }: { control: Control<ProfileFormValues> }) {
  return (
    <FormField
      control={control}
      name="bitcoin_address"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-semibold flex items-center gap-2">
            <Bitcoin className="w-4 h-4 text-orange-500" />
            Bitcoin Address
          </FormLabel>
          <FormControl>
            <Input
              placeholder="bc1..."
              className="font-mono text-sm"
              {...field}
            />
          </FormControl>
          <FormDescription>
            Your on-chain Bitcoin address (starts with bc1, 1, or 3)
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Lightning address field
export function LightningAddressField({ control }: { control: Control<ProfileFormValues> }) {
  return (
    <FormField
      control={control}
      name="lightning_address"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Lightning Address
          </FormLabel>
          <FormControl>
            <Input
              placeholder="you@getalby.com"
              className="font-mono text-sm"
              {...field}
            />
          </FormControl>
          <FormDescription>
            Your Lightning Network address (email format)
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Website field
export function WebsiteField({ control }: { control: Control<ProfileFormValues> }) {
  return (
    <FormField
      control={control}
      name="website"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            Website
          </FormLabel>
          <FormControl>
            <Input
              placeholder="orangecat.ch or https://your-website.com"
              {...field}
            />
          </FormControl>
          <FormDescription>
            Your personal website or portfolio
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
