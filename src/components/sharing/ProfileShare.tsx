'use client';

import { useState } from 'react';
import {
  Share2,
  X,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes';

interface ProfileShareProps {
  username: string;
  profileName: string;
  profileBio?: string;
  currentUrl?: string;
  onClose?: () => void;
  variant?: 'dropdown' | 'modal';
  className?: string;
}

interface SharePlatform {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  action: (url: string, title: string, description?: string) => void;
}

export default function ProfileShare({
  username,
  profileName,
  profileBio = '',
  currentUrl,
  onClose,
  variant = 'dropdown',
  className = '',
}: ProfileShareProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Construct the profile URL
  const profileUrl =
    currentUrl ||
    `${typeof window !== 'undefined' ? window.location.origin : 'https://orangecat.ch'}${ROUTES.PROFILES.VIEW(username)}`;

  // Create optimized share text
  const shareTitle = `${profileName} on OrangeCat`;
  const shareDescription =
    profileBio || `Check out ${profileName}'s profile on OrangeCat - Bitcoin fundraising platform`;

  // Social media sharing platforms
  const platforms: SharePlatform[] = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: (url, title, description) => {
        const text = `${title}\n\n${description}\n\n#Bitcoin #OrangeCat`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: (url, title) => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
        window.open(facebookUrl, '_blank', 'width=550,height=420');
      },
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: (url, title, description) => {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description || '')}`;
        window.open(linkedinUrl, '_blank', 'width=550,height=420');
      },
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      action: (url, title) => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
        window.open(whatsappUrl, '_blank');
      },
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      action: (url, title, description) => {
        const subject = encodeURIComponent(`Check out ${title}`);
        const body = encodeURIComponent(`${description}\n\n${url}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      },
    },
  ];

  // Handle native share (mobile)
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: profileUrl,
        });
        if (onClose) {
          onClose();
        }
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    }
  };

  // Handle platform-specific sharing
  const handlePlatformShare = (platform: SharePlatform) => {
    platform.action(profileUrl, shareTitle, shareDescription);
    if (onClose) {
      onClose();
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopySuccess(true);
      toast.success('Profile URL copied to clipboard!');
      setTimeout(() => {
        setCopySuccess(false);
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  // Check if native share is available
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Default dropdown variant - Responsive width
  return (
    <div
      className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-screen max-w-[calc(100vw-2rem)] sm:w-80 sm:max-w-none ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Share Profile
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Native Share (Mobile) - Show as primary option if available */}
      {hasNativeShare && (
        <button
          onClick={handleNativeShare}
          className="w-full mb-4 flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium transition-all"
        >
          <Share2 className="w-4 h-4" />
          Share via...
        </button>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {platforms.slice(0, 3).map(platform => {
          const Icon = platform.icon;
          return (
            <button
              key={platform.name}
              onClick={() => handlePlatformShare(platform)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${platform.bgColor}`}
            >
              <Icon className={`w-5 h-5 ${platform.color}`} />
              <span className="text-xs font-medium text-gray-900">{platform.name}</span>
            </button>
          );
        })}
      </div>

      {/* More Options */}
      <div className="space-y-2">
        {platforms.slice(3).map(platform => {
          const Icon = platform.icon;
          return (
            <button
              key={platform.name}
              onClick={() => handlePlatformShare(platform)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${platform.bgColor}`}
            >
              <Icon className={`w-5 h-5 ${platform.color}`} />
              <span className="text-sm font-medium text-gray-900">{platform.name}</span>
            </button>
          );
        })}

        {/* Copy URL */}
        <button
          onClick={handleCopy}
          className="w-full flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          {copySuccess ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Copy className="w-5 h-5 text-gray-600" />
          )}
          <span className="text-sm font-medium text-gray-900">
            {copySuccess ? 'Copied!' : 'Copy URL'}
          </span>
        </button>
      </div>
    </div>
  );
}
