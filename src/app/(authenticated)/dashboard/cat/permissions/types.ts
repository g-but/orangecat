export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresConfirmation: boolean;
}

export interface CategorySummary {
  category: string;
  name: string;
  description: string;
  enabled: boolean;
  actionCount: number;
  enabledActionCount: number;
}

export interface PermissionData {
  summary: {
    categories: CategorySummary[];
    totalActions: number;
    enabledActions: number;
    highRiskEnabled: boolean;
  };
  availableActions: Action[];
  categories: Category[];
}
