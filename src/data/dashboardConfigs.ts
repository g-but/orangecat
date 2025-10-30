// Re-export dashboard configurations from the modular structure - MVP
// Only profiles and projects for MVP
export { fundraisingConfig, projectsConfig } from '@/config/dashboard';

// Re-export demo data from the new location - MVP
export { demoProjects } from './demo';

// Re-export types - MVP
export type { ProjectData } from './demo';
