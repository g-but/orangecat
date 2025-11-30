'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Save,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  User,
  MapPin,
  Wallet,
  Star,
} from 'lucide-react';
import { LocationInput } from '@/components/ui/LocationInput';
import { WalletManager } from '@/components/wallets/WalletManager';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { Profile } from '@/types/profile';
import { ProfileFormData } from '@/types/database';
import { profileSchema } from '@/lib/validation';
import { ProfileImagesSection } from './ModernProfileEditor';

type ProfileFormValues = {
  username?: string | null;
  name?: string | null;
  bio?: string | null;
  location_country?: string | null;
  location_city?: string | null;
  location_zip?: string | null;
  location_search?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_context?: string | null;
  background?: string | null;
  inspiration_statement?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  website?: string | null;
  bitcoin_address?: string | null;
  lightning_address?: string | null;
};

interface ProfileWizardProps {
  profile: Profile;
  userId: string;
  userEmail: string;
  onSave: (data: ProfileFormData) => Promise<void>;
  onCancel: () => void;
}

const STEPS = [
  {
    id: 'basics',
    title: '👋 Basic Info',
    description: 'Just your username and name to get started',
    icon: User,
    fields: ['username', 'name'],
    required: true,
    priority: 'high',
  },
  {
    id: 'location',
    title: '📍 Your Location',
    description: 'Help local supporters find you',
    icon: MapPin,
    fields: ['location_search', 'location_country', 'location_city', 'location_zip'],
    required: false,
    priority: 'medium',
  },
  {
    id: 'bio',
    title: '📖 About You',
    description: 'Tell your story and what inspires you',
    icon: Star,
    fields: ['bio', 'background', 'inspiration_statement'],
    required: false,
    priority: 'medium',
  },
  {
    id: 'wallets',
    title: '₿ Bitcoin Wallets',
    description: "Set up donations (we'll help you get started)",
    icon: Wallet,
    fields: ['bitcoin_address', 'lightning_address'],
    required: false,
    priority: 'low',
  },
];

export default function ProfileWizard({
  profile,
  userId,
  userEmail,
  onSave,
  onCancel,
}: ProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Form setup
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      username: profile.username || userEmail?.split('@')[0] || '',
      name: profile.name || '',
      bio: profile.bio || '',
      location_country: profile.location_country || '',
      location_city: profile.location_city || '',
      location_zip: profile.location_zip || '',
      location_search: profile.location_search || '',
      latitude: profile.latitude || undefined,
      longitude: profile.longitude || undefined,
      location_context: profile.location_context || '',
      background: profile.background || '',
      inspiration_statement: profile.inspiration_statement || '',
      location: profile.location || '',
      avatar_url: profile.avatar_url || '',
      banner_url: profile.banner_url || '',
      website: profile.website || '',
      bitcoin_address: profile.bitcoin_address || '',
      lightning_address: profile.lightning_address || '',
    },
  });

  const calculateProgress = () => {
    const completedSteps = STEPS.slice(0, currentStep).length;
    const currentStepProgress = getStepProgress();
    return Math.round(((completedSteps + currentStepProgress) / STEPS.length) * 100);
  };

  const getStepProgress = () => {
    const step = STEPS[currentStep];
    const stepFields = step.fields;
    const filledFields = stepFields.filter(field => {
      const value = form.getValues(field as keyof ProfileFormValues);
      return value !== null && value !== undefined && value !== '';
    });
    return filledFields.length / stepFields.length;
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSave();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = form.getValues();
      await onSave(data as ProfileFormData);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = () => {
    const step = STEPS[currentStep];
    // Only username is required, other fields are optional
    if (step.id === 'basics') {
      return !!form.getValues('username');
    }
    return true;
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome! Let's set up your profile
              </h2>
              <p className="text-gray-600 mb-3">
                This will help people understand who you are and what you're about.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                <span>💡</span>
                <span>Only username is required - everything else is optional</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Username
                    <span className="text-red-500 text-xs font-bold">*</span>
                    <span className="text-xs text-gray-500 font-normal">(required)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Choose a unique username"
                      className="text-sm"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    This will be your public profile URL: orangecat.ch/@username
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Display Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Your full name or display name"
                      className="text-sm"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Optional: How you want to be displayed publicly
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Tell people about yourself, your interests, or what you're working on..."
                      className="text-sm resize-none"
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Optional: Share your story to build trust with supporters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Where are you located?</h2>
              <p className="text-gray-600 mb-3">
                Help local people find and support your projects.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                <span>🌍</span>
                <span>All location fields are optional</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="location_search"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </FormLabel>
                  <FormControl>
                    <LocationInput
                      value={field.value || ''}
                      onChange={locationData => {
                        if (locationData) {
                          form.setValue('location_country', locationData.country);
                          form.setValue('location_city', locationData.city);
                          form.setValue('location_zip', locationData.zipCode);
                          form.setValue('location_search', locationData.formattedAddress);

                          // Store canton/state information in location_context
                          if (locationData.country === 'CH' && locationData.canton) {
                            const cantonInfo = locationData.cantonCode
                              ? `${locationData.canton} (${locationData.cantonCode})`
                              : locationData.canton;
                            form.setValue('location_context', cantonInfo);
                          } else if (locationData.state) {
                            const stateInfo = locationData.stateCode
                              ? `${locationData.state} (${locationData.stateCode})`
                              : locationData.state;
                            form.setValue('location_context', stateInfo);
                          }

                          if (locationData.latitude && locationData.longitude) {
                            form.setValue('latitude', locationData.latitude);
                            form.setValue('longitude', locationData.longitude);
                          }
                        } else {
                          form.setValue('location_country', '');
                          form.setValue('location_city', '');
                          form.setValue('location_zip', '');
                          form.setValue('location_search', '');
                          form.setValue('location_context', '');
                          form.setValue('latitude', undefined);
                          form.setValue('longitude', undefined);
                        }
                      }}
                      placeholder="Search for your city or address..."
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Start typing to find your location. This helps local people and projects find
                    you.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Location Context
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Any additional context about your location? (e.g., 'Based in Zurich, working remotely')"
                      className="text-sm resize-none"
                      rows={2}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Optional: Add context to help people understand your location better
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'background':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Your Story</h2>
              <p className="text-gray-600 mb-3">Help supporters understand what drives you.</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                <span>💭</span>
                <span>All story fields are optional</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Professional Background
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="What's your background? Any relevant experience or education..."
                      className="text-sm resize-none"
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Optional: Share your experience to build credibility
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inspiration_statement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    What Inspires You?
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="What drives you? What's your 'why'?"
                      className="text-sm resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Optional: Help supporters understand your motivation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'wallets':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bitcoin Wallets</h2>
              <p className="text-gray-600 mb-3">
                Set up addresses where people can send you donations.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">
                <span>₿</span>
                <span>All wallet fields are optional</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="bitcoin_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Bitcoin Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Enter your Bitcoin address (starts with bc1, 1, or 3)"
                      className="text-sm font-mono"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Optional: Your Bitcoin address for receiving donations
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lightning_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Lightning Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="yourname@lightning.provider.com"
                      className="text-sm"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Optional: Lightning address for instant, low-fee payments
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="text-center text-gray-600 py-8">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Wallets Later</h3>
                <p className="text-sm mb-4">
                  You can add and manage multiple Bitcoin wallets from your profile page or
                  dashboard after completing setup.
                </p>
                <p className="text-xs text-gray-500">
                  Go to Profile → Wallets tab or Dashboard → My Wallets
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header with Progress */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-orange-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div>
              <h1 className="text-xl font-semibold text-gray-900">Complete Your Profile</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{calculateProgress()}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Step Navigation */}
        <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-orange-50 border-b relative">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isUpcoming = index > currentStep;

              return (
                <div key={step.id} className="flex-1 flex flex-col items-center relative">
                  {/* Step Circle */}
                  <div
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white shadow-lg'
                        : isCurrent
                          ? 'bg-orange-500 border-orange-500 text-white shadow-lg animate-pulse'
                          : isUpcoming
                            ? 'bg-white border-gray-300 text-gray-400'
                            : 'bg-gray-200 border-gray-300 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span className="text-lg">{step.title.split(' ')[0]}</span>
                    )}

                    {/* Priority indicator */}
                    {step.required && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
                    )}
                  </div>

                  {/* Step Title */}
                  <div className="mt-3 text-center">
                    <div
                      className={`text-sm font-semibold transition-colors ${
                        isCompleted
                          ? 'text-green-600'
                          : isCurrent
                            ? 'text-orange-600'
                            : 'text-gray-500'
                      }`}
                    >
                      {step.title.split(' ').slice(1).join(' ')}
                    </div>
                    <div
                      className={`text-xs mt-1 transition-colors ${
                        isCompleted
                          ? 'text-green-500'
                          : isCurrent
                            ? 'text-orange-500'
                            : 'text-gray-400'
                      }`}
                    >
                      {isCompleted
                        ? '✓ Complete'
                        : isCurrent
                          ? 'In Progress'
                          : step.required
                            ? 'Required'
                            : 'Optional'}
                    </div>
                  </div>

                  {/* Connection Line */}
                  {index < STEPS.length - 1 && (
                    <div
                      className={`absolute top-6 left-1/2 w-full h-0.5 transition-colors ${
                        isCompleted ? 'bg-green-400' : 'bg-gray-300'
                      }`}
                      style={{
                        width: 'calc(100% - 3rem)',
                        left: 'calc(50% + 1.5rem)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Step Description */}
          <div className="mt-6 text-center max-w-md mx-auto">
            <p className="text-sm text-gray-600 leading-relaxed">
              {STEPS[currentStep].description}
            </p>
            {STEPS[currentStep].required && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full">
                <span>⚠️</span>
                <span>This step is required to continue</span>
              </div>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form className="max-w-2xl mx-auto">{renderStepContent()}</form>
          </Form>
        </div>

        {/* Enhanced Footer with Navigation */}
        <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-orange-50 border-t">
          {/* Progress encouragement */}
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600 mb-2">
              {currentStep === 0 && "🚀 Let's get your profile started!"}
              {currentStep === 1 && '📍 Great! Local supporters will love this.'}
              {currentStep === 2 && '📖 Your story matters - share it!'}
              {currentStep === STEPS.length - 1 && '₿ Almost there! Donations await.'}
            </div>
            <div className="text-xs text-gray-500">
              {STEPS.filter((_, i) => i <= currentStep).length} of {STEPS.length} steps completed
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? onCancel : handlePrevious}
              disabled={isSaving}
              className="px-6"
            >
              {currentStep === 0 ? (
                'Maybe Later'
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </>
              )}
            </Button>

            <div className="flex items-center gap-3">
              {/* Skip option for optional steps */}
              {currentStep > 0 && !STEPS[currentStep].required && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Skip for now
                </Button>
              )}

              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || isSaving}
                className="px-8 py-2 min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSaving ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : currentStep === STEPS.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" /> Complete Profile
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Optional encouragement for completion */}
          {currentStep === STEPS.length - 1 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                🎉 Completing your profile unlocks donation features and helps you stand out!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
