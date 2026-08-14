import { MessageSquare, type LucideIcon } from 'lucide-react';
import {
  COLOR_CLASSES,
  getEntitiesForCreateMenu,
  type EntityCategory,
  type EntityMetadata,
} from '@/config/entity-registry';
import { PROGRAM_BLUEPRINTS } from '@/config/program-blueprints';
import { ROUTES } from '@/config/routes';

export type CreateOptionCategory = EntityCategory | 'content' | 'program';

export interface CreateOption {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  category: CreateOptionCategory;
}

export const CREATE_PAGE = {
  title: 'Create',
  lede: 'Say it, or pick a type.',
} as const;

export const CREATE_CATEGORY_LABELS: Record<CreateOptionCategory, string> = {
  content: 'Share',
  gateway: 'Get paid',
  business: 'Sell or fund',
  community: 'People',
  finance: 'Money',
  personal: 'For you',
  program: 'Whole programs',
};

function optionFromEntity(entity: EntityMetadata): CreateOption {
  const colors = COLOR_CLASSES[entity.colorTheme];
  return {
    name: entity.name,
    description: entity.createActionLabel,
    href: entity.createPath,
    icon: entity.icon,
    color: colors.text,
    bgColor: colors.bg,
    category: entity.category,
  };
}

/**
 * A program blueprint creates several entities at once, so it belongs in the
 * create menu next to the single-entity options rather than hidden behind them.
 */
function optionFromBlueprint(blueprint: (typeof PROGRAM_BLUEPRINTS)[number]): CreateOption {
  return {
    name: blueprint.name,
    description: blueprint.tagline,
    href: ROUTES.DASHBOARD.PROGRAM_VIEW(blueprint.id),
    icon: blueprint.icon,
    color: 'text-fg-primary',
    bgColor: 'bg-surface-raised',
    category: 'program',
  };
}

export function buildCreateOptions(): CreateOption[] {
  const post: CreateOption = {
    name: 'Post',
    description: 'Share an update on your timeline',
    href: '/timeline?compose=true',
    icon: MessageSquare,
    color: 'text-fg-primary',
    bgColor: 'bg-surface-raised',
    category: 'content',
  };
  return [
    post,
    ...getEntitiesForCreateMenu().map(optionFromEntity),
    ...PROGRAM_BLUEPRINTS.map(optionFromBlueprint),
  ];
}

export const CREATE_OPTIONS = buildCreateOptions();

export function shouldShowDivider(current: CreateOption, next: CreateOption | undefined): boolean {
  if (!next) {
    return false;
  }
  return current.category !== next.category;
}
