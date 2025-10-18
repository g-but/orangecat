// Re-export dashboard configurations from the modular structure
export {
  assetsConfig,
  peopleConfig,
  fundraisingConfig,
  organizationsConfig,
  eventsConfig,
  projectsConfig
} from '@/config/dashboard'

// Re-export demo data from the new location
export {
  demoAssets,
  demoOrganizations,
  demoEvents,
  demoProjects
} from './demo'

// Re-export types
export type {
  AssetData,
  OrganizationData,
  EventData,
  ProjectData
} from './demo'

