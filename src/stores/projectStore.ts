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
import supabase from '@/lib/supabase/browser';
import { getTableName } from '@/config/entity-registry';

// Use existing FundingPage type from funding.ts
import type { FundingPage } from '@/types/funding';

export interface Project extends FundingPage {
  isDraft: boolean;
  isActive: boolean;
  isPaused: boolean;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  creator_name?: string;
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
  deleteProject: (id: string) => Promise<void>;
  updateProjectStatus: (
    id: string,
    status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  ) => Promise<void>;
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
      const { data, error } = await supabase
        .from(getTableName('project'))
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projects: Project[] = (data || []).map((project: any) => ({
        ...project,
        // Map database fields to FundingPage interface
        total_funding: project.raised_amount ?? project.total_funding ?? 0,
        current_amount: project.raised_amount ?? project.total_funding ?? 0,
        raised_amount: project.raised_amount ?? 0,
        isDraft: project.status === 'draft',
        isActive: project.status === 'active',
        isPaused: project.status === 'paused',
        // Ensure boolean fields exist
        is_active: project.status === 'active',
        is_public: project.status !== 'draft',
        contributor_count: project.contributor_count ?? 0,
      }));

      set({ projects, isLoading: false });
      logger.info(`Loaded ${projects.length} projects for user ${userId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load projects';
      logger.error('Failed to load projects:', error);
      set({ error: message, isLoading: false });
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete project');
      }

      // Remove the project from the store
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        isLoading: false,
      }));

      logger.info(`Deleted project ${id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      logger.error('Failed to delete project:', error);
      set({ error: message, isLoading: false });
      throw error; // Re-throw so the UI can handle it
    }
  },

  updateProjectStatus: async (
    id: string,
    status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  ) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/projects/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update project status');
      }

      const { data: updatedProject } = await response.json();

      // Update the project in the store
      set(state => ({
        projects: state.projects.map(p =>
          p.id === id
            ? {
                ...p,
                ...updatedProject,
                status: updatedProject.status,
                isDraft: updatedProject.status === 'draft',
                isActive: updatedProject.status === 'active',
                isPaused: updatedProject.status === 'paused',
                is_active: updatedProject.status === 'active',
                is_public: updatedProject.status !== 'draft',
              }
            : p
        ),
        isLoading: false,
      }));

      logger.info(`Updated project ${id} status to ${status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update project status';
      logger.error('Failed to update project status:', error);
      set({ error: message, isLoading: false });
      throw error; // Re-throw so the UI can handle it
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
