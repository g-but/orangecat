'use client';

import { useState, useEffect } from 'react';
import { X, Clock, ExternalLink } from 'lucide-react';
import Button from './Button';
import { Card, CardContent } from './Card';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  timeline?: string;
  learnMoreUrl?: string;
}

export default function ComingSoonModal({
  isOpen,
  onClose,
  featureName,
  timeline = 'Coming Soon',
  learnMoreUrl,
}: ComingSoonModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <Card className="relative w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <CardContent className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{featureName} Coming Soon!</h3>

            <p className="text-gray-600 mb-1">
              This feature is not yet available but is coming {timeline.toLowerCase()}.
            </p>

            <p className="text-sm text-gray-600 mb-6">
              We&apos;re working hard to bring you this feature. Check back soon for updates!
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Got it
              </Button>

              {learnMoreUrl && (
                <Button
                  onClick={() => {
                    window.open(learnMoreUrl, '_blank');
                    onClose();
                  }}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Learn More
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
