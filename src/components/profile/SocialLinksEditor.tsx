'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SocialLink } from '@/types/social';
import {
  getPlatformById,
  getPredefinedPlatforms,
  type SocialPlatformId,
} from '@/lib/social-platforms';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';

interface SocialLinksEditorProps {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
  maxLinks?: number;
}

/**
 * SocialLinksEditor Component
 *
 * Progressive disclosure pattern - users add links one at a time.
 * Follows the same pattern as WalletManager for consistency.
 *
 * Features:
 * - List of added links
 * - "+ Add Social Link" button
 * - Platform selector with predefined options + Custom
 * - Validation per platform
 * - Easy to extend: just add to SOCIAL_PLATFORMS config
 */
export function SocialLinksEditor({ links, onChange, maxLinks = 15 }: SocialLinksEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const canAddMore = links.length < maxLinks;

  // Add new link
  const handleAdd = (link: SocialLink) => {
    if (links.length >= maxLinks) {
      return;
    }
    onChange([...links, link]);
    setIsAdding(false);
  };

  // Update existing link
  const handleUpdate = (index: number, link: SocialLink) => {
    const updated = [...links];
    updated[index] = link;
    onChange(updated);
    setEditingIndex(null);
  };

  // Delete link
  const handleDelete = (index: number) => {
    if (confirm('Remove this social link?')) {
      const updated = links.filter((_, i) => i !== index);
      onChange(updated);
    }
  };

  // Cancel adding/editing
  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700">Social Media & Links</h4>
          <p className="text-xs text-gray-500">
            {links.length} {links.length === 1 ? 'link' : 'links'} added
          </p>
        </div>
        {canAddMore && !isAdding && editingIndex === null && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            + Add Link
          </button>
        )}
      </div>

      {/* Add new link form */}
      {isAdding && (
        <SocialLinkForm
          onSubmit={handleAdd}
          onCancel={handleCancel}
          existingPlatforms={links.map(l => l.platform)}
        />
      )}

      {/* Links list */}
      <div className="space-y-2">
        {links.map((link, index) => (
          <div key={index}>
            {editingIndex === index ? (
              <SocialLinkForm
                initialLink={link}
                onSubmit={updatedLink => handleUpdate(index, updatedLink)}
                onCancel={handleCancel}
                existingPlatforms={
                  links
                    .map((l, i) => (i !== index ? l.platform : null))
                    .filter(Boolean) as SocialPlatformId[]
                }
              />
            ) : (
              <SocialLinkCard
                link={link}
                onEdit={() => setEditingIndex(index)}
                onDelete={() => handleDelete(index)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {links.length === 0 && !isAdding && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">No social links yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Add links to build credibility and help supporters find you
          </p>
          {canAddMore && (
            <Button onClick={() => setIsAdding(true)} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Your First Link
            </Button>
          )}
        </div>
      )}

      {/* Helper text */}
      {links.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          💡 More complete profiles build higher transparency scores
        </p>
      )}
    </div>
  );
}

// Social Link Card Component
function SocialLinkCard({
  link,
  onEdit,
  onDelete,
}: {
  link: SocialLink;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const platform = getPlatformById(link.platform);
  const Icon = platform?.icon || X;
  const displayLabel = link.platform === 'custom' ? link.label : platform?.label || link.platform;
  const displayValue = link.value;

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors bg-gray-50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <Icon className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-700 truncate">{displayLabel}</div>
          <div className="text-xs text-gray-500 truncate">{displayValue}</div>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button onClick={onEdit} variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          onClick={onDelete}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Social Link Form Component
function SocialLinkForm({
  initialLink,
  onSubmit,
  onCancel,
  existingPlatforms = [],
}: {
  initialLink?: SocialLink;
  onSubmit: (link: SocialLink) => void;
  onCancel: () => void;
  existingPlatforms?: SocialPlatformId[];
}) {
  const [platform, setPlatform] = useState<SocialPlatformId>(initialLink?.platform || 'x');
  const [label, setLabel] = useState(initialLink?.label || '');
  const [value, setValue] = useState(initialLink?.value || '');
  const [error, setError] = useState<string | null>(null);

  const platformConfig = getPlatformById(platform);
  const isCustom = platform === 'custom';
  const predefinedPlatforms = getPredefinedPlatforms();
  const availablePlatforms = predefinedPlatforms.filter(
    p => !existingPlatforms.includes(p.id) || (initialLink && p.id === initialLink.platform)
  );

  const handleSubmit = () => {
    setError(null);

    // Validate
    if (isCustom && !label.trim()) {
      setError('Platform name is required for custom links');
      return;
    }

    if (!value.trim()) {
      setError('Value is required');
      return;
    }

    // Platform-specific validation
    if (platformConfig?.validation) {
      const validation = platformConfig.validation(value);
      if (!validation.valid) {
        setError(validation.error || 'Invalid format');
        return;
      }
    }

    // For custom, ensure it's a valid URL
    if (isCustom) {
      try {
        new URL(value);
      } catch {
        setError('Please enter a valid URL');
        return;
      }
    }

    onSubmit({
      platform,
      label: isCustom ? label.trim() : undefined,
      value: value.trim(),
    });
  };

  const Icon = platformConfig?.icon || X;

  return (
    <div className="border rounded-lg p-4 bg-white space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">
          {initialLink ? 'Edit Link' : 'Add Social Link'}
        </h4>
        <Button onClick={onCancel} variant="ghost" size="sm" className="h-6 w-6 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Platform selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availablePlatforms.map(p => {
            const PlatformIcon = p.icon;
            const isSelected = platform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPlatform(p.id);
                  setError(null);
                }}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <PlatformIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{p.label}</span>
                </div>
              </button>
            );
          })}
          {/* Custom option */}
          <button
            type="button"
            onClick={() => {
              setPlatform('custom');
              setError(null);
            }}
            className={`p-3 border rounded-lg text-left transition-colors ${
              platform === 'custom'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-300 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Custom</span>
            </div>
          </button>
        </div>
      </div>

      {/* Custom platform label */}
      {isCustom && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name *</label>
          <Input
            value={label}
            onChange={e => {
              setLabel(e.target.value);
              setError(null);
            }}
            placeholder="e.g., YouTube, TikTok, OnlyFans"
            required
          />
        </div>
      )}

      {/* Value input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isCustom ? 'URL *' : platformConfig?.label || 'Value'} *
        </label>
        <div className="relative">
          {platformConfig && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Icon className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <Input
            value={value}
            onChange={e => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder={platformConfig?.placeholder || 'Enter URL or username'}
            className={platformConfig ? 'pl-10' : ''}
            required
          />
        </div>
        {platformConfig?.formatHint && (
          <p className="mt-1 text-xs text-gray-500">{platformConfig.formatHint}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSubmit} className="flex-1">
          {initialLink ? 'Save Changes' : 'Add Link'}
        </Button>
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  );
}
