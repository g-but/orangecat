/**
 * WalletPreferencesForm Component
 *
 * Form for collecting user wallet preferences.
 * Extracted from WalletRecommendation component.
 */

'use client';

import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { UserPreferences } from './useWalletRecommendation';

interface PreferenceOption {
  value: string;
  label: string;
  desc: string;
}

interface WalletPreferencesFormProps {
  preferences: UserPreferences;
  onPreferenceChange: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  onSubmit: () => void;
}

const EXPERIENCE_OPTIONS: PreferenceOption[] = [
  { value: 'beginner', label: 'Beginner', desc: 'New to Bitcoin' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
  { value: 'advanced', label: 'Advanced', desc: 'Power user' },
];

const PRIVACY_OPTIONS: PreferenceOption[] = [
  { value: 'low', label: 'Basic', desc: 'Simple, convenient' },
  { value: 'medium', label: 'Standard', desc: 'Good balance' },
  { value: 'high', label: 'Maximum', desc: 'Privacy focused' },
];

const CUSTODY_OPTIONS: PreferenceOption[] = [
  { value: 'self-custody', label: 'Self-Custody', desc: 'You control your keys' },
  { value: 'custodial', label: 'Custodial', desc: 'Third party holds keys' },
];

const DEVICE_OPTIONS: PreferenceOption[] = [
  { value: 'mobile', label: 'Mobile', desc: 'Phone or tablet' },
  { value: 'desktop', label: 'Desktop', desc: 'Computer' },
  { value: 'both', label: 'Both', desc: 'Mobile & desktop' },
];

interface RadioGroupProps {
  name: string;
  label: string;
  options: PreferenceOption[];
  value: string;
  onChange: (value: string) => void;
}

function RadioGroup({ name, label, options, value, onChange }: RadioGroupProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
      <div className="space-y-2">
        {options.map(option => (
          <label key={option.value} className="flex items-center">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={e => onChange(e.target.value)}
              className="mr-3"
            />
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-gray-600">{option.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

export function WalletPreferencesForm({
  preferences,
  onPreferenceChange,
  onSubmit,
}: WalletPreferencesFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Tell us about your needs</h2>
        <p className="text-gray-600 mb-8">
          We'll recommend the best Bitcoin wallets based on your preferences and requirements.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RadioGroup
            name="experience"
            label="Your Experience Level"
            options={EXPERIENCE_OPTIONS}
            value={preferences.experience}
            onChange={value =>
              onPreferenceChange('experience', value as UserPreferences['experience'])
            }
          />

          <RadioGroup
            name="privacy"
            label="Privacy Level"
            options={PRIVACY_OPTIONS}
            value={preferences.privacy}
            onChange={value => onPreferenceChange('privacy', value as UserPreferences['privacy'])}
          />

          <RadioGroup
            name="custody"
            label="Key Control"
            options={CUSTODY_OPTIONS}
            value={preferences.custody}
            onChange={value => onPreferenceChange('custody', value as UserPreferences['custody'])}
          />

          <RadioGroup
            name="device"
            label="Preferred Device"
            options={DEVICE_OPTIONS}
            value={preferences.device}
            onChange={value => onPreferenceChange('device', value as UserPreferences['device'])}
          />
        </div>

        <div className="flex justify-center mt-8">
          <Button
            onClick={onSubmit}
            className="bg-bitcoinOrange hover:bg-bitcoinOrange/90 text-white px-8 py-3"
          >
            Get My Recommendations
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
