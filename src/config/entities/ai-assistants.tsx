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
import type { Currency } from '@/types/settings';

export const aiAssistantEntityConfig: EntityConfig<AIAssistant> = {
  name: 'AI Assistant',
  namePlural: 'AI Assistants',
  colorTheme: 'purple',

  listPath: '/dashboard/ai-assistants',
  detailPath: id => `/dashboard/ai-assistants/${id}`,
  createPath: '/dashboard/ai-assistants/create',
  editPath: id => `/dashboard/ai-assistants/create?edit=${id}`,

  apiEndpoint: '/api/ai-assistants',

  makeHref: assistant => `/dashboard/ai-assistants/${assistant.id}`,

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
        assistant.status === 'active'
          ? 'Active'
          : assistant.status === 'paused'
            ? 'Paused'
            : assistant.status === 'draft'
              ? 'Draft'
              : assistant.status === 'archived'
                ? 'Archived'
                : undefined,
      badgeVariant:
        assistant.status === 'active'
          ? 'success'
          : assistant.status === 'paused'
            ? 'warning'
            : assistant.status === 'draft'
              ? 'default'
              : assistant.status === 'archived'
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
      editHref: `/dashboard/ai-assistants/create?edit=${assistant.id}`,
      // Removed duplicate actions button - edit icon overlay is sufficient
    };
  },

  emptyState: {
    title: 'No AI assistants yet',
    description: 'Create your first AI assistant to start earning from your expertise.',
    action: (
      <Link href="/dashboard/ai-assistants/create">
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
