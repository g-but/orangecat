'use client'

import { motion } from 'framer-motion'
import { User, Bitcoin, Globe } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  UsernameField,
  DisplayNameField,
  BioField,
  BitcoinAddressField,
  LightningAddressField,
  WebsiteField
} from './ProfileFormFields'
import { Control } from 'react-hook-form'
import type { ProfileFormValues } from './ModernProfileEditor'

interface ProfileTabsProps {
  control: Control<ProfileFormValues>
}

export function ProfileTabs({ control }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8 bg-orange-50 p-1">
        <TabsTrigger value="basic" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Basic Info</span>
        </TabsTrigger>
        <TabsTrigger value="payment" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <Bitcoin className="w-4 h-4" />
          <span className="hidden sm:inline">Payment</span>
        </TabsTrigger>
        <TabsTrigger value="social" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">Social</span>
        </TabsTrigger>
      </TabsList>

      {/* Basic Info Tab */}
      <TabsContent value="basic" className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <UsernameField control={control} />
          <DisplayNameField control={control} />
          <BioField control={control} />
        </motion.div>
      </TabsContent>

      {/* Payment Tab */}
      <TabsContent value="payment" className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Bitcoin className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-900">Bitcoin Payment Details</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Add your Bitcoin addresses to receive donations and payments
                </p>
              </div>
            </div>
          </div>

          <BitcoinAddressField control={control} />
          <LightningAddressField control={control} />
        </motion.div>
      </TabsContent>

      {/* Social Tab */}
      <TabsContent value="social" className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <WebsiteField control={control} />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Coming Soon!</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Twitter, GitHub, and other social links will be available soon
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </TabsContent>
    </Tabs>
  )
}

