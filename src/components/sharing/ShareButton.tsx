'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import CampaignShare from './CampaignShare';

interface ShareButtonProps {
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
  projectImage?: string;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ShareButton({
  projectId,
  projectTitle,
  projectDescription,
  projectImage,
  variant = 'button',
  size = 'md',
  className = '',
}: ShareButtonProps) {
  const [showShare, setShowShare] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setShowShare(false);
      }
    };

    if (showShare) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShare]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowShare(false);
      }
    };

    if (showShare) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [showShare]);

  const toggleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShare(!showShare);
  };

  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={toggleShare}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Share project"
        >
          <Share2
            className={`${
              size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
            } text-gray-600`}
          />
        </button>

        {showShare && (
          <div ref={dropdownRef} className="absolute top-full right-0 mt-2 z-50">
            <CampaignShare
              projectId={projectId}
              projectTitle={projectTitle}
              projectDescription={projectDescription}
              projectImage={projectImage}
              variant="dropdown"
              onClose={() => setShowShare(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        ref={buttonRef}
        onClick={toggleShare}
        variant="outline"
        size={size}
        className="flex items-center gap-2"
      >
        <Share2
          className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`}
        />
        Share
      </Button>

      {showShare && (
        <div ref={dropdownRef} className="absolute top-full right-0 mt-2 z-50">
          <CampaignShare
            projectId={projectId}
            projectTitle={projectTitle}
            projectDescription={projectDescription}
            projectImage={projectImage}
            variant="dropdown"
            onClose={() => setShowShare(false)}
          />
        </div>
      )}
    </div>
  );
}
