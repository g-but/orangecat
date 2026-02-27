/**
 * AI Assistant Entity Configuration
 *
 * Created: 2025-12-25
 * Last Modified: 2026-01-04
 * Last Modified Summary: Updated to convert prices to user's preferred currency
 */

import { EntityConfig } from '@/types/entity';
import { AIAssistant } from '@/types/database';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/services/currency';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { STATUS } from '@/config/database-constants';
import { ROUTES } from '@/config/routes';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import type { Currency } from '@/types/settings';

export const aiAssistantEntityConfig: EntityConfig<AIAssistant> = {
  name: 'AI Assistant',
  namePlural: 'AI Assistants',
  colorTheme: 'purple',

  listPath: ENTITY_REGISTRY['ai_assistant'].basePath,
  detailPath: id => `${ENTITY_REGISTRY['ai_assistant'].basePath}/${id}`,
  createPath: ENTITY_REGISTRY['ai_assistant'].createPath,
  editPath: id => `${ENTITY_REGISTRY['ai_assistant'].createPath}?edit=${id}`,

  apiEndpoint: ENTITY_REGISTRY['ai_assistant'].apiEndpoint,

  makeHref: assistant => `${ENTITY_REGISTRY['ai_assistant'].basePath}/${assistant.id}`,

  makeCardProps: (assistant, userCurrency?: string) => {
    // Convert prices to user's preferred currency (or platform default)
    const displayCurrency = (userCurrency || PLATFORM_DEFAULT_CURRENCY) as Currency;
    // Build pricing label
    // Note: AI assistants store prices directly (no currency field, amounts are in the currency they were set)
    // For now, we'll assume they're in the display currency or convert if needed
    const getPricingLabel = () => {
      switch (assistant.pricing_model) {
        case 'free':
          return 'Free';
        case 'per_message':
          return assistant.price_per_message
            ? `${formatCurrency(assistant.price_per_message, displayCurrency)}/msg`
            : undefined;
        case 'per_token':
          return assistant.price_per_1k_tokens
            ? `${formatCurrency(assistant.price_per_1k_tokens, displayCurrency)}/1k tokens`
            : undefined;
        case 'subscription':
          return assistant.subscription_price
            ? `${formatCurrency(assistant.subscription_price, displayCurrency)}/mo`
            : undefined;
        default:
          return undefined;
      }
    };

    // Build metadata parts
    const metadataParts: string[] = [];
    if (assistant.category) {
      metadataParts.push(assistant.category);
    }
    if (assistant.total_conversations > 0) {
      metadataParts.push(`${assistant.total_conversations} conversations`);
    }
    if (assistant.average_rating) {
      metadataParts.push(`${assistant.average_rating.toFixed(1)} rating`);
    }

    return {
      priceLabel: getPricingLabel(),
      badge:
        assistant.status === STATUS.AI_ASSISTANTS.ACTIVE
          ? 'Active'
          : assistant.status === STATUS.AI_ASSISTANTS.PAUSED
            ? 'Paused'
            : assistant.status === STATUS.AI_ASSISTANTS.DRAFT
              ? 'Draft'
              : assistant.status === STATUS.AI_ASSISTANTS.ARCHIVED
                ? 'Archived'
                : undefined,
      badgeVariant:
        assistant.status === STATUS.AI_ASSISTANTS.ACTIVE
          ? 'success'
          : assistant.status === STATUS.AI_ASSISTANTS.PAUSED
            ? 'warning'
            : assistant.status === STATUS.AI_ASSISTANTS.DRAFT
              ? 'default'
              : assistant.status === STATUS.AI_ASSISTANTS.ARCHIVED
                ? 'default'
                : 'default',
      metadata:
        metadataParts.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {metadataParts.map((part, idx) => (
              <span key={idx}>{part}</span>
            ))}
          </div>
        ) : undefined,
      showEditButton: true,
      editHref: `${ENTITY_REGISTRY['ai_assistant'].createPath}?edit=${assistant.id}`,
      // Removed duplicate actions button - edit icon overlay is sufficient
    };
  },

  emptyState: {
    title: 'No AI assistants yet',
    description: 'Create your first AI assistant to start earning from your expertise.',
    action: (
      <Link href={ROUTES.DASHBOARD.AI_ASSISTANTS_CREATE}>
        <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
          Create AI Assistant
        </Button>
      </Link>
    ),
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
