/**
 * Initiative type definition shared across OrangeCat.
 * created_date: 2025-06-12
 * last_modified_date: 2025-06-12
 * last_modified_summary: Initial extraction of Initiative interface from data/initiatives.ts into a dedicated shared types file for reusability and maintainability.
 */

export interface Initiative {
  id: string;
  name: string;
  icon: string;
  color: {
    primary: string;
    gradient: string;
    bg: string;
    text: string;
    border: string;
  };
  description: string;
  longDescription: string;
  status: 'available' | 'coming-soon';
  timeline?: string;
  routes: {
    landing: string;
    demo?: string;
    comingSoon: string;
    create?: string;
  };
  features: Array<{
    icon: string;
    title: string;
    description: string;
    color: string;
  }>;
  types: Array<{
    name: string;
    icon: string;
    description: string;
    example: string;
    color: string;
  }>;
  capabilities: string[];
  useCases: string[];
  marketTools: Array<{
    name: string;
    description: string;
    url: string;
    icon: string;
    color: string;
  }>;
} 