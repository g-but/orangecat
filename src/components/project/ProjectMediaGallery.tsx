'use client';

import { useEffect, useMemo, useState } from 'react';
import supabaseBrowser from '@/lib/supabase/browser';

interface MediaItem {
  id: string;
  storage_path: string;
  position: number;
  alt_text?: string | null;
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
    <div className={`grid gap-3 ${className}`}>
      <div className="w-full overflow-hidden rounded-xl border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primary.url}
          alt={primary.alt_text || 'Project image'}
          className="w-full h-auto object-cover"
        />
      </div>
      {thumbs.length > 0 && (
        <div className="flex gap-3">
          {thumbs.map(t => (
            <div key={t.id} className="h-20 w-28 overflow-hidden rounded-lg border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.url}
                alt={t.alt_text || 'Project image'}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
