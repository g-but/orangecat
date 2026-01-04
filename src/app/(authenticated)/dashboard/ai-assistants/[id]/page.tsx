import EntityDetailPage from '@/components/entity/EntityDetailPage';
import { aiAssistantEntityConfig } from '@/config/entities/ai-assistants';
import type { AIAssistant } from '@/types/database';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * AI Assistant Detail Page
 *
 * Unified detail page using EntityDetailPage component.
 *
 * Created: 2026-01-03
 * Last Modified: 2026-01-03
 * Last Modified Summary: Initial creation using unified EntityDetailPage component
 */
export default async function AIAssistantDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <EntityDetailPage<AIAssistant>
      config={aiAssistantEntityConfig}
      entityId={id}
      requireAuth={true}
      redirectPath="/auth?mode=login&from=/dashboard/ai-assistants"
      makeDetailFields={(assistant) => {
        const left = [
          { label: 'Status', value: assistant.status ? assistant.status.charAt(0).toUpperCase() + assistant.status.slice(1) : 'Draft' },
          { label: 'Category', value: assistant.category || '—' },
          { label: 'Model Preference', value: assistant.model_preference || 'Any' },
          { label: 'Pricing Model', value: assistant.pricing_model ? assistant.pricing_model.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—' },
        ];

        if (assistant.price_per_message_sats) {
          left.push({ label: 'Price per Message', value: `${assistant.price_per_message_sats.toLocaleString()} sats` });
        }
        if (assistant.free_messages_per_day) {
          left.push({ label: 'Free Messages/Day', value: String(assistant.free_messages_per_day) });
        }

        if (assistant.tags && assistant.tags.length > 0) {
          left.push({ label: 'Tags', value: assistant.tags.join(', ') });
        }

        const right: Array<{ label: string; value: string }> = [];

        if (assistant.lightning_address) {
          right.push({ label: 'Lightning Address', value: assistant.lightning_address });
        }
        if (assistant.bitcoin_address) {
          right.push({ label: 'Bitcoin Address', value: assistant.bitcoin_address });
        }

        if (assistant.created_at) {
          right.push({ label: 'Created', value: new Date(assistant.created_at).toLocaleString() });
        }
        if (assistant.updated_at) {
          right.push({ label: 'Updated', value: new Date(assistant.updated_at).toLocaleString() });
        }
        if (assistant.published_at) {
          right.push({ label: 'Published', value: new Date(assistant.published_at).toLocaleString() });
        }

        return { left, right };
      }}
    />
  );
}
