'use client';

/**
 * Step 2: About You - bio, location, website.
 * Optional step for profile completion.
 */

import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { MapPin, Globe } from 'lucide-react';

interface AboutStepProps {
  bio: string;
  locationCity: string;
  website: string;
  onBioChange: (value: string) => void;
  onLocationCityChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
}

export function AboutStep({
  bio,
  locationCity,
  website,
  onBioChange,
  onLocationCityChange,
  onWebsiteChange,
}: AboutStepProps) {
  return (
    <div className="space-y-5">
      <Textarea
        label="Bio"
        description="A few words about yourself. Your Cat uses this to understand you better."
        value={bio}
        onChange={e => onBioChange(e.target.value)}
        placeholder="Builder, dreamer, orange-pilled since 2017..."
        maxLength={500}
      />

      <Input
        label="Location"
        description="City or region (shown on your public profile)"
        value={locationCity}
        onChange={e => onLocationCityChange(e.target.value)}
        placeholder="Zurich, Switzerland"
        icon={MapPin}
        maxLength={100}
      />

      <Input
        label="Website"
        description="Your personal site, blog, or Nostr profile"
        value={website}
        onChange={e => onWebsiteChange(e.target.value)}
        placeholder="https://yoursite.com"
        icon={Globe}
        maxLength={200}
      />
    </div>
  );
}
