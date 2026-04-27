'use client';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Mail } from 'lucide-react';

interface Props {
  email: string;
  isSubmitting: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SettingsEmailSection({ email, isSubmitting, onChange, onSubmit }: Props) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Address</h3>
      <p className="text-gray-600 mb-6">
        This is the email address associated with your account. You&apos;ll receive important
        notifications here.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={onChange}
          icon={Mail}
          className="max-w-md"
        />
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
          <p className="text-base text-blue-800">
            <strong>Note:</strong> When you update your email, we&apos;ll send a confirmation link
            to your new address.
          </p>
        </div>
        <div className="flex justify-start">
          <Button type="submit" variant="outline" disabled={isSubmitting} className="px-6 py-2">
            {isSubmitting ? 'Updating...' : 'Update Email'}
          </Button>
        </div>
      </form>
    </div>
  );
}
