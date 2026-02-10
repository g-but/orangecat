'use client';

/**
 * ProjectMediaGallery Component
 *
 * Modern image gallery with lightbox functionality.
 *
 * Image Optimization:
 * - Next.js Image component automatically optimizes images on-the-fly
 * - Serves WebP/AVIF formats when supported by browser
 * - Resizes images based on viewport using `sizes` prop
 * - Only loads the size needed for display (not full resolution)
 * - Caches optimized versions for faster subsequent loads
 *
 * Note: Original images are stored at full size in Supabase storage,
 * but users only download optimized, resized versions.
 */

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import supabaseBrowser from '@/lib/supabase/browser';
import Image from 'next/image';

interface MediaItem {
  id: string;
  storage_path: string;
  position: number;
  alt_text?: string | null;
  url?: string;
}

interface ProjectMediaGalleryProps {
  projectId: string;
  className?: string;
}

export default function ProjectMediaGallery({
  projectId,
  className = '',
}: ProjectMediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabaseBrowser
          .from('project_media')
          .select('id, storage_path, position, alt_text')
          .eq('project_id', projectId)
          .order('position', { ascending: true });

        if (error) {
          throw error;
        }
        if (!mounted) {
          return;
        }
        setMedia((data || []) as MediaItem[]);
      } catch {
        if (!mounted) {
          return;
        }
        setMedia([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    if (projectId) {
      load();
    }
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const publicUrls = useMemo(() => {
    return media.map(m => {
      const { data } = supabaseBrowser.storage.from('project-media').getPublicUrl(m.storage_path);
      return { ...m, url: data.publicUrl as string };
    });
  }, [media]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex(prev => (prev > 0 ? prev - 1 : publicUrls.length - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex(prev => (prev < publicUrls.length - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => (prev > 0 ? prev - 1 : publicUrls.length - 1));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => (prev < publicUrls.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, publicUrls.length]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on backdrop, not on image container
    if (e.target === e.currentTarget) {
      closeLightbox();
    }
  };

  if (loading) {
    return (
      <div className={`grid gap-2 ${className}`} aria-busy>
        <div className="w-full aspect-video rounded-lg bg-gray-100 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-16 w-24 rounded bg-gray-100 animate-pulse" />
          <div className="h-16 w-24 rounded bg-gray-100 animate-pulse" />
          <div className="h-16 w-24 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!publicUrls.length) {
    return null;
  }

  const [primary, ...thumbs] = publicUrls;

  return (
    <>
      <div className={`grid gap-2 ${className}`}>
        {/* Main Image - Clickable - Smaller and Elegant */}
        <div
          className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white cursor-pointer group relative aspect-[16/9] max-h-[400px]"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={primary.url}
            alt={primary.alt_text || 'Project image'}
            width={800}
            height={450}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
            quality={80}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Click to view full size
            </div>
          </div>
        </div>

        {/* Thumbnail Grid */}
        {thumbs.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {thumbs.slice(0, 3).map((thumb, idx) => (
              <div
                key={thumb.id}
                className="aspect-[4/3] overflow-hidden rounded-md border border-gray-200 bg-white cursor-pointer group relative"
                onClick={() => openLightbox(idx + 1)}
              >
                <Image
                  src={thumb.url}
                  alt={thumb.alt_text || 'Project image'}
                  width={300}
                  height={225}
                  sizes="(max-width: 768px) 25vw, 150px"
                  quality={75}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
              </div>
            ))}
            {thumbs.length > 3 && (
              <div
                className="aspect-[4/3] overflow-hidden rounded-md border border-gray-200 bg-gray-50 cursor-pointer group relative flex items-center justify-center"
                onClick={() => openLightbox(4)}
              >
                <div className="text-center">
                  <div className="text-xl font-semibold text-gray-700">+{thumbs.length - 3}</div>
                  <div className="text-xs text-gray-500">more</div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* Close Button */}
          <button
            onClick={e => closeLightbox(e)}
            className="absolute top-4 right-4 z-[60] text-white/90 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20 bg-black/40 backdrop-blur-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Container - Constrained Size */}
          <div
            className="relative max-w-6xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={publicUrls[lightboxIndex].url}
                alt={publicUrls[lightboxIndex].alt_text || 'Project image'}
                width={1400}
                height={1050}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1400px"
                quality={85}
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                priority
              />
            </div>

            {/* Navigation Arrows */}
            {publicUrls.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white hover:text-white transition-all p-2 md:p-3 rounded-full hover:bg-white/20 bg-black/50 backdrop-blur-sm z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white hover:text-white transition-all p-2 md:p-3 rounded-full hover:bg-white/20 bg-black/50 backdrop-blur-sm z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium z-10">
              {lightboxIndex + 1} / {publicUrls.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
