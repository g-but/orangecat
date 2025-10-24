/**
 * PROJECT STORE - MVP Implementation
 *
 * Simplified store for managing projects (fundraising campaigns)
 * - Fetch projects for a user
 * - Basic CRUD operations
 * - Simple state management with Zustand
 */

import { create } from 'zustand';
import { logger } from '@/utils/logger';
import getSupabaseClient from '@/lib/supabase/browser';

// Use existing FundingPage type from funding.ts
import type { FundingPage } from '@/types/funding';

export interface Project extends FundingPage {
  isDraft: boolean;
  isActive: boolean;
  isPaused: boolean;
}

export interface ProjectState {
  // DATA
  projects: Project[];

  // STATUS
  isLoading: boolean;
  error: string | null;

  // COMPUTED
  drafts: Project[];
  activeProjects: Project[];

  // ACTIONS
  loadProjects: (userId: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
  getStats: () => { totalProjects: number; totalActive: number };

  // UTILITIES
  reset: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // DATA
  projects: [],

  // STATUS
  isLoading: false,
  error: null,

  // COMPUTED
  get drafts() {
    return get().projects.filter(p => p.isDraft);
  },

  get activeProjects() {
    return get().projects.filter(p => p.isActive && !p.isDraft);
  },

  // ACTIONS
  loadProjects: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const projects: Project[] = (data || []).map((project: any) => ({
        ...project,
        isDraft: project.status === 'draft',
        isActive: project.status === 'active',
        isPaused: project.status === 'paused',
      }));

      set({ projects, isLoading: false });
      logger.info(`Loaded ${projects.length} projects for user ${userId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load projects';
      logger.error('Failed to load projects:', error);
      set({ error: message, isLoading: false });
    }
  },

  getProjectById: (id: string) => {
    return get().projects.find(p => p.id === id);
  },

  getStats: () => {
    const state = get();
    return {
      totalProjects: state.projects.length,
      totalActive: state.activeProjects.length,
    };
  },

  reset: () => {
    set({
      projects: [],
      isLoading: false,
      error: null,
    });
  },
}));

// BACKWARDS COMPATIBILITY - Old campaignStore imports
export const useCampaignStore = useProjectStore;
export type Campaign = Project;
export type CampaignState = ProjectState;
