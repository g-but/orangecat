/**
 * ProjectHeader Component
 *
 * Displays project title, creator info, status, and action buttons
 *
 * Created: 2025-01-27
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, Share2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/lib/routes';

interface ProjectHeaderProps {
  project: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    user_id: string;
    profiles?: {
      username: string | null;
      name: string | null;
      avatar_url: string | null;
      id?: string;
    };
  };
  isOwner: boolean;
  onShare: () => void;
  getStatusInfo: (status: string) => { label: string; className: string };
}

export function ProjectHeader({ project, isOwner, onShare, getStatusInfo }: ProjectHeaderProps) {
  const statusInfo = getStatusInfo(project.status);
  const creatorProfileUrl = project.profiles?.username
    ? `/profile/${project.profiles.username}`
    : project.profiles?.id
      ? `/profile/${project.profiles.id}`
      : `/profile/${project.user_id}`;

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{project.title}</h1>

          {/* Creator Info */}
          {project.profiles ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                  <Link
                    href={creatorProfileUrl}
                    className="hover:opacity-80 transition-opacity"
                    aria-label={`View ${project.profiles.name || project.profiles.username || 'creator'}'s profile`}
                  >
                    {project.profiles.avatar_url ? (
                      <Image
                        src={project.profiles.avatar_url}
                        alt={
                          project.profiles.name ||
                          project.profiles.username ||
                          'Creator'
                        }
                        width={32}
                        height={32}
                        className="rounded-full cursor-pointer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity">
                        {(
                          project.profiles.name ||
                          project.profiles.username ||
                          project.profiles.id?.substring(0, 1) ||
                          'A'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                </Link>
                <div>
                  <p className="text-sm text-gray-500">Created by</p>
                  <Link
                    href={creatorProfileUrl}
                    className="text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                  >
                    {project.profiles.name ||
                      project.profiles.username ||
                      `User ${project.profiles.id?.substring(0, 8) || 'Unknown'}`}
                  </Link>
                </div>
              </div>
            </div>
          ) : project.user_id ? (
            // Profile exists but wasn't loaded - show user ID as fallback
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold text-sm">
                ?
              </div>
              <div>
                <p className="text-sm text-gray-500">Created by</p>
                <Link
                  href={`/profiles/${project.user_id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                >
                  User {project.user_id.substring(0, 8)}
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold text-sm">
                ?
              </div>
              <div>
                <p className="text-sm text-gray-500">Created by</p>
                <span className="text-sm font-semibold text-gray-900">Anonymous</span>
              </div>
            </div>
          )}

          {/* Status and Date */}
          <div className="flex items-center gap-3 flex-wrap">
            {project.status !== 'draft' && project.status !== 'active' && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}
                aria-label={`Project status: ${statusInfo.label}`}
              >
                {statusInfo.label}
              </span>
            )}
            <time dateTime={project.created_at} className="text-sm text-gray-500">
              Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
            </time>
          </div>
        </div>

        {/* Action Buttons */}
        {isOwner && (
          <div className="flex gap-2 flex-shrink-0" role="group" aria-label="Project actions">
            <Link href={ROUTES.PROJECTS.EDIT(project.id)}>
              <Button variant="outline" size="sm" aria-label="Edit project">
                <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={onShare} aria-label="Share project">
              <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Share
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
