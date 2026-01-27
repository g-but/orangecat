/**
 * ProjectFormFields Component
 *
 * Renders the form fields for project creation/editing.
 * Extracted from ProjectWizard for better separation of concerns.
 *
 * @module components/wizard
 */

'use client';

import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { X, ExternalLink } from 'lucide-react';
import ProjectMediaUpload from '@/components/project/ProjectMediaUpload';
import type { ProjectFormData, FormErrors } from './types';
import type { ProjectFieldType } from '@/lib/project-guidance';
import { AVAILABLE_CATEGORIES } from './constants';

interface ProjectFormFieldsProps {
  formData: ProjectFormData;
  errors: FormErrors;
  isEditMode: boolean;
  editProjectId: string | null;
  onFieldChange: (field: keyof FormErrors, value: string) => void;
  onFieldBlur: (field: keyof FormErrors) => void;
  onFieldFocus?: (field: ProjectFieldType) => void;
  onCurrencyChange: (currency: 'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS') => void;
  onCategoryToggle: (category: string) => void;
}

export function ProjectFormFields({
  formData,
  errors,
  isEditMode,
  editProjectId,
  onFieldChange,
  onFieldBlur,
  onFieldFocus,
  onCurrencyChange,
  onCategoryToggle,
}: ProjectFormFieldsProps) {
  const handleFieldFocus = (field: ProjectFieldType) => {
    if (onFieldFocus) {
      onFieldFocus(field);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
        <Input
          value={formData.title}
          onChange={e => onFieldChange('title', e.target.value)}
          onFocus={() => handleFieldFocus('title')}
          onBlur={() => onFieldBlur('title')}
          placeholder="e.g., Community Garden Project"
          className={errors.title ? 'border-red-500' : ''}
          autoFocus
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <Textarea
          value={formData.description}
          onChange={e => onFieldChange('description', e.target.value)}
          onFocus={() => handleFieldFocus('description')}
          onBlur={() => onFieldBlur('description')}
          placeholder="What's your project about?"
          rows={6}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        <p className="mt-1 text-xs text-gray-500">{formData.description.length}/2000</p>
      </div>

      {/* Goal Amount & Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goal Amount (optional)
          </label>
          <Input
            type="number"
            value={formData.goalAmount}
            onChange={e => onFieldChange('goalAmount', e.target.value)}
            onFocus={() => handleFieldFocus('goalAmount')}
            onBlur={() => onFieldBlur('goalAmount')}
            placeholder="5000"
            className={errors.goalAmount ? 'border-red-500' : ''}
          />
          {errors.goalAmount && <p className="mt-1 text-sm text-red-600">{errors.goalAmount}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Display Currency</label>
          <select
            value={formData.goalCurrency}
            onChange={e => {
              const value = e.target.value;
              if (['CHF', 'USD', 'EUR', 'BTC', 'SATS'].includes(value)) {
                onCurrencyChange(value as 'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS');
              }
              handleFieldFocus('currency');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="CHF">CHF</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="BTC">BTC</option>
            <option value="SATS">SATS</option>
          </select>
        </div>
      </div>

      {/* Funding Purpose */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Funding Purpose (optional)
        </label>
        <Input
          value={formData.fundingPurpose}
          onChange={e => onFieldChange('fundingPurpose' as keyof FormErrors, e.target.value)}
          onFocus={() => handleFieldFocus('fundingPurpose')}
          placeholder="e.g., Equipment, salaries, marketing"
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Categories</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_CATEGORIES.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => {
                onCategoryToggle(category);
                handleFieldFocus('categories');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                formData.selectedCategories.includes(category)
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
              {formData.selectedCategories.includes(category) && (
                <X className="w-3 h-3 inline ml-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Website URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Website (optional)
        </label>
        <Input
          value={formData.websiteUrl}
          onChange={e => onFieldChange('websiteUrl', e.target.value)}
          onFocus={() => handleFieldFocus('websiteUrl' as ProjectFieldType)}
          onBlur={() => onFieldBlur('websiteUrl')}
          placeholder="https://yourproject.com"
          className={errors.websiteUrl ? 'border-red-500' : ''}
        />
        {errors.websiteUrl && <p className="mt-1 text-sm text-red-600">{errors.websiteUrl}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Link to your project's website or social media page
        </p>
      </div>

      {/* Bitcoin Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bitcoin Address (add later)
        </label>
        <Input
          value={formData.bitcoinAddress}
          onChange={e => onFieldChange('bitcoinAddress', e.target.value)}
          onFocus={() => handleFieldFocus('bitcoinAddress')}
          onBlur={() => onFieldBlur('bitcoinAddress')}
          placeholder="bc1q..."
          className={errors.bitcoinAddress ? 'border-red-500' : ''}
        />
        {errors.bitcoinAddress && (
          <p className="mt-1 text-sm text-red-600">{errors.bitcoinAddress}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <span>Don't have a wallet?</span>
          <Link
            href="/wallets"
            target="_blank"
            className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
          >
            Get one <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Project Images - Only in Edit Mode */}
      {isEditMode && editProjectId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Images (optional)
          </label>
          <ProjectMediaUpload projectId={editProjectId} />
          <p className="mt-2 text-xs text-gray-500">
            Upload up to 3 images to showcase your project. First image will be the cover.
          </p>
        </div>
      )}
    </div>
  );
}
