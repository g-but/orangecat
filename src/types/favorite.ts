/**
 * Types for favorited projects
 *
 * Created: 2025-01-27
 */

import { Project } from '@/stores/projectStore';

export interface FavoriteProject extends Project {
  favorited_at?: string;
  profiles?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}
